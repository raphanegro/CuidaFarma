export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

async function gerarAlertasAutomaticos(pacienteId: string) {
  const [medicamentos, exames, historico] = await Promise.all([
    prisma.medicamentoEmUso.findMany({
      where: { pacienteId, status: 'EM_USO' },
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

  // Alerta de polifarmacia
  if (medicamentos.length >= 5) {
    const nomes = medicamentos
      .map((m) => m.medicamento?.nome ?? m.nomeCustom ?? 'Medicamento')
      .join(', ')
    alertas.push({
      tipo: 'POLIFARMACIA',
      severidade: medicamentos.length >= 10 ? 'CRITICO' : 'ATENCAO',
      descricao: `Paciente em uso de ${medicamentos.length} medicamentos simultaneos (polifarmacia${medicamentos.length >= 10 ? ' grave' : ''}).`,
      medicamentosEnvolvidos: nomes,
      sugestaoAcao: 'Revisar necessidade de todos os medicamentos. Considerar reconciliacao medicamentosa.',
    })
  }

  // Exames fora da faixa de referencia
  for (const e of exames) {
    if (e.refMin == null && e.refMax == null) continue
    const valor = Number(e.valor)
    const min = e.refMin != null ? Number(e.refMin) : null
    const max = e.refMax != null ? Number(e.refMax) : null
    const foraFaixa = (min != null && valor < min) || (max != null && valor > max)
    if (!foraFaixa) continue
    const alto = max != null && valor > max
    alertas.push({
      tipo: 'EXAME_FORA_FAIXA',
      severidade: 'ATENCAO',
      descricao: `${e.tipo}: ${valor} ${e.unidade} — fora da faixa de referencia (${min ?? '?'}–${max ?? '?'} ${e.unidade}).`,
      sugestaoAcao: alto
        ? `Valor acima do limite superior. Avaliar ${e.tipo}.`
        : `Valor abaixo do limite inferior. Avaliar ${e.tipo}.`,
    })
  }

  // Usar IA para detectar interacoes se houver >= 2 medicamentos
  if (medicamentos.length >= 2) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const nomes = medicamentos
        .map((m) => {
          const nome = m.medicamento?.nome ?? m.nomeCustom ?? 'Medicamento'
          return `${nome}${m.dose ? ` (${m.dose})` : ''}`
        })
        .join(', ')
      const prompt = `Analise os seguintes medicamentos em uso simultaneo e identifique APENAS interacoes medicamentosas clinicamente relevantes:

Medicamentos: ${nomes}
Condicoes ativas: ${historico.map((h) => h.doenca).join(', ') || 'nao informadas'}

Responda em JSON com o formato:
{
  "interacoes": [
    {
      "medicamentos": "Nome1 + Nome2",
      "severidade": "CRITICO|ATENCAO|INFORMATIVO",
      "descricao": "Descricao breve",
      "sugestao": "Sugestao de manejo"
    }
  ]
}
Se nao houver interacoes relevantes, retorne {"interacoes": []}`

      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = resp.content[0].type === 'text' ? resp.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { interacoes: Array<{ medicamentos?: string; severidade?: string; descricao?: string; sugestao?: string }> }
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
    } catch (err) {
      // MEDIO-01: logar falha da IA em vez de silenciar
      console.error('[alertas-clinicos] Erro ao chamar IA para deteccao de interacoes:', err)
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

  const { pacienteId } = await request.json() as { pacienteId: string }
  if (!pacienteId) return NextResponse.json({ error: 'pacienteId required' }, { status: 400 })

  // Remover alertas ativos anteriores (serao recalculados)
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
