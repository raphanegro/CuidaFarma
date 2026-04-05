export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

async function gerarAlertasAutomaticos(pacienteId: string) {
  const [medicamentos, exames, historico] = await Promise.all([
    prisma.medicamentoEmUso.findMany({
      where: { pacienteId, ativo: true },
      include: { medicamento: true },
    }),
    prisma.resultadoExame.findMany({
      where: { pacienteId },
      orderBy: { dataColeta: 'desc' },
      take: 20,
    }),
    prisma.historicoClinico.findMany({
      where: { pacienteId, status: 'ATIVA' },
    }),
  ])

  const alertas: Array<{
    tipo: string
    severidade: string
    descricao: string
    medicamentosEnvolvidos?: string
    sugestaoAcao?: string
  }> = []

  // Alerta de polifarmácia
  if (medicamentos.length >= 5) {
    alertas.push({
      tipo: 'POLIFARMACIA',
      severidade: medicamentos.length >= 10 ? 'CRITICO' : 'ATENCAO',
      descricao: `Paciente em uso de ${medicamentos.length} medicamentos simultâneos (polifarmácia${medicamentos.length >= 10 ? ' grave' : ''}).`,
      medicamentosEnvolvidos: medicamentos.map((m) => m.medicamento.nome).join(', '),
      sugestaoAcao: 'Revisar necessidade de todos os medicamentos. Considerar reconciliação medicamentosa.',
    })
  }

  // Exames fora da faixa de referência
  const examesFora = exames.filter((e) => e.resultado && e.refMin != null && e.refMax != null && (e.resultado < e.refMin || e.resultado > e.refMax))
  for (const e of examesFora) {
    const alto = e.refMax != null && e.resultado! > e.refMax
    alertas.push({
      tipo: 'EXAME_FORA_FAIXA',
      severidade: 'ATENCAO',
      descricao: `${e.exame}: ${e.resultado} ${e.unidade ?? ''} — fora da faixa de referência (${e.refMin ?? '?'}–${e.refMax ?? '?'} ${e.unidade ?? ''}).`,
      sugestaoAcao: alto ? `Valor acima do limite superior. Avaliar ${e.exame}.` : `Valor abaixo do limite inferior. Avaliar ${e.exame}.`,
    })
  }

  // Usar IA para detectar interações se houver ≥2 medicamentos
  if (medicamentos.length >= 2) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const nomes = medicamentos.map((m) => `${m.medicamento.nome} (${m.posologia ?? 'posologia não informada'})`).join(', ')
      const prompt = `Analise os seguintes medicamentos em uso simultâneo por um paciente e identifique APENAS interações medicamentosas clinicamente relevantes (não liste se não houver interações):

Medicamentos: ${nomes}
Condições ativas: ${historico.map((h) => h.doenca).join(', ') || 'não informadas'}

Responda em JSON com o formato:
{
  "interacoes": [
    {
      "medicamentos": "Nome1 + Nome2",
      "severidade": "CRITICO|ATENCAO|INFORMATIVO",
      "descricao": "Descrição breve",
      "sugestao": "Sugestão de manejo"
    }
  ]
}
Se não houver interações relevantes, retorne {"interacoes": []}`

      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = resp.content[0].type === 'text' ? resp.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        for (const inter of (parsed.interacoes ?? [])) {
          alertas.push({
            tipo: 'INTERACAO',
            severidade: inter.severidade ?? 'ATENCAO',
            descricao: inter.descricao ?? '',
            medicamentosEnvolvidos: inter.medicamentos ?? '',
            sugestaoAcao: inter.sugestao ?? '',
          })
        }
      }
    } catch {
      // IA indisponível — continua sem alertas de interação
    }
  }

  return alertas
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pacienteId = request.nextUrl.searchParams.get('pacienteId')
  if (!pacienteId) return NextResponse.json({ error: 'pacienteId required' }, { status: 400 })

  const alertas = await prisma.alertaClinico.findMany({
    where: { pacienteId },
    orderBy: [{ severidade: 'asc' }, { criadoEm: 'desc' }],
  })
  return NextResponse.json(alertas)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pacienteId } = await request.json()
  if (!pacienteId) return NextResponse.json({ error: 'pacienteId required' }, { status: 400 })

  // Remover alertas ativos anteriores (serão recalculados)
  await prisma.alertaClinico.deleteMany({
    where: { pacienteId, estado: 'ATIVO' },
  })

  const novosAlertas = await gerarAlertasAutomaticos(pacienteId)

  if (novosAlertas.length > 0) {
    await prisma.alertaClinico.createMany({
      data: novosAlertas.map((a) => ({ ...a, pacienteId })),
    })
  }

  const alertas = await prisma.alertaClinico.findMany({
    where: { pacienteId },
    orderBy: [{ severidade: 'asc' }, { criadoEm: 'desc' }],
  })
  return NextResponse.json(alertas)
}
