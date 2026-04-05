export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

// Retorna matriz: visitas × medicamentos com comparação entre visitas consecutivas
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('pacienteId')
  if (!pacienteId) return NextResponse.json({ error: 'pacienteId obrigatório' }, { status: 400 })

  // Busca todos os atendimentos do paciente ordenados por data
  const atendimentos = await prisma.atendimento.findMany({
    where: { pacienteId, paciente: { usuarioId: session.user.id } },
    select: {
      id: true,
      dataAtendimento: true,
      tipo: true,
      avaliacoesAdesao: {
        include: {
          medicamentoEmUso: {
            select: { id: true, nomeCustom: true, dose: true, frequencia: true, medicamento: { select: { nome: true } } },
          },
        },
      },
    },
    orderBy: { dataAtendimento: 'asc' },
  })

  // Filtra apenas atendimentos que têm pelo menos uma avaliação de adesão
  const visitasComAdesao = atendimentos.filter((a) => a.avaliacoesAdesao.length > 0)

  // Coleta todos os medicamentos únicos avaliados
  const medMap = new Map<string, { id: string; nome: string; dose?: string | null; frequencia?: string | null }>()
  for (const visita of visitasComAdesao) {
    for (const av of visita.avaliacoesAdesao) {
      const id = av.medicamentoEmUso.id
      if (!medMap.has(id)) {
        medMap.set(id, {
          id,
          nome: av.medicamentoEmUso.medicamento?.nome ?? av.medicamentoEmUso.nomeCustom ?? 'Medicamento',
          dose: av.medicamentoEmUso.dose,
          frequencia: av.medicamentoEmUso.frequencia,
        })
      }
    }
  }

  // Monta matriz: medicamentoId → { visitaId → avaliação }
  const matriz: Record<string, Record<string, { taxa: number; classificacao: string; qtdEsperada: number; qtdContada: number; observacao?: string | null }>> = {}
  for (const [medId] of medMap) {
    matriz[medId] = {}
    for (const visita of visitasComAdesao) {
      const av = visita.avaliacoesAdesao.find((a) => a.medicamentoEmUsoId === medId)
      if (av) {
        matriz[medId][visita.id] = {
          taxa: Number(av.taxaAdesao),
          classificacao: av.classificacao,
          qtdEsperada: av.qtdEsperada,
          qtdContada: av.qtdContada,
          observacao: av.observacao,
        }
      }
    }
  }

  // Calcula tendência por medicamento (últimas 2 visitas com dados)
  const tendencias: Record<string, 'melhora' | 'piora' | 'estavel' | null> = {}
  for (const [medId] of medMap) {
    const avaliacoesOrdenadas = visitasComAdesao
      .filter((v) => matriz[medId][v.id])
      .map((v) => matriz[medId][v.id].taxa)
    if (avaliacoesOrdenadas.length >= 2) {
      const ultima = avaliacoesOrdenadas[avaliacoesOrdenadas.length - 1]
      const penultima = avaliacoesOrdenadas[avaliacoesOrdenadas.length - 2]
      const diff = ultima - penultima
      tendencias[medId] = diff >= 5 ? 'melhora' : diff <= -5 ? 'piora' : 'estavel'
    } else {
      tendencias[medId] = null
    }
  }

  return NextResponse.json({
    visitas: visitasComAdesao.map((v) => ({
      id: v.id,
      data: v.dataAtendimento,
      tipo: v.tipo,
    })),
    medicamentos: Array.from(medMap.values()),
    matriz,
    tendencias,
  })
}
