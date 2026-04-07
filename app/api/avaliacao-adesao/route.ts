export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ClassificacaoAdesao } from '@prisma/client'

function calcularAdesao(qtdEsperada: number, qtdContada: number): {
  taxaAdesao: number
  classificacao: ClassificacaoAdesao
} {
  const taxa = qtdEsperada > 0
    ? Math.min(Math.round((qtdContada / qtdEsperada) * 100 * 100) / 100, 100)
    : 0
  const classificacao: ClassificacaoAdesao =
    taxa >= 80 ? 'BOA' : taxa >= 60 ? 'PARCIAL' : 'BAIXA'
  return { taxaAdesao: taxa, classificacao }
}

// GET /api/avaliacao-adesao?pacienteId=&atendimentoId=
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('pacienteId')
  const atendimentoId = searchParams.get('atendimentoId')

  if (!pacienteId && !atendimentoId) {
    return NextResponse.json({ error: 'Informe pacienteId ou atendimentoId' }, { status: 400 })
  }

  const avaliacoes = await prisma.avaliacaoAdesao.findMany({
    where: {
      ...(pacienteId ? { pacienteId, paciente: { usuarioId: session.user.id } } : {}),
      ...(atendimentoId ? { atendimentoId, atendimento: { paciente: { usuarioId: session.user.id } } } : {}),
    },
    include: {
      medicamentoEmUso: {
        select: { id: true, nomeCustom: true, frequencia: true, medicamento: { select: { nome: true } } },
      },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(avaliacoes)
}

// POST /api/avaliacao-adesao
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { atendimentoId, pacienteId, medicamentoEmUsoId, qtdEsperada, qtdContada, qtdDispensada, observacao } = body

  if (!atendimentoId || !pacienteId || !medicamentoEmUsoId || qtdEsperada === undefined || qtdContada === undefined) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: atendimentoId, pacienteId, medicamentoEmUsoId, qtdEsperada, qtdContada' },
      { status: 400 }
    )
  }

  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, paciente: { usuarioId: session.user.id } },
    select: { id: true },
  })
  if (!atendimento) {
    return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 })
  }

  const { taxaAdesao, classificacao } = calcularAdesao(Number(qtdEsperada), Number(qtdContada))

  const avaliacao = await prisma.avaliacaoAdesao.create({
    data: {
      atendimentoId,
      pacienteId,
      medicamentoEmUsoId,
      qtdEsperada: Number(qtdEsperada),
      qtdContada: Number(qtdContada),
      qtdDispensada: qtdDispensada != null ? Number(qtdDispensada) : null,
      taxaAdesao,
      classificacao,
      observacao: observacao ?? null,
    },
    include: {
      medicamentoEmUso: {
        select: { id: true, nomeCustom: true, medicamento: { select: { nome: true } } },
      },
    },
  })

  return NextResponse.json(avaliacao, { status: 201 })
}
