import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth'
import { prisma } from '@/app/lib/prisma'
import { StatusProblema } from '@prisma/client'

// GET /api/prm?pacienteId=&atendimentoId=&status=
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('pacienteId')
  const atendimentoId = searchParams.get('atendimentoId')
  const statusParam = searchParams.get('status') as StatusProblema | null

  if (!pacienteId && !atendimentoId) {
    return NextResponse.json({ error: 'Informe pacienteId ou atendimentoId' }, { status: 400 })
  }

  const problemas = await prisma.problemaMedicamento.findMany({
    where: {
      ...(pacienteId ? { pacienteId, paciente: { usuarioId: session.user.id } } : {}),
      ...(atendimentoId ? { atendimentoId, atendimento: { paciente: { usuarioId: session.user.id } } } : {}),
      ...(statusParam ? { status: statusParam } : {}),
    },
    include: {
      medicamentoEmUso: { select: { id: true, nomeCustom: true, medicamento: { select: { nome: true } } } },
    },
    orderBy: [{ status: 'asc' }, { criadoEm: 'desc' }],
  })

  return NextResponse.json(problemas)
}

// POST /api/prm
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { atendimentoId, pacienteId, medicamentoEmUsoId, categoria, descricao, gravidade } = body

  if (!atendimentoId || !pacienteId || !categoria || !descricao || !gravidade) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: atendimentoId, pacienteId, categoria, descricao, gravidade' },
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

  const problema = await prisma.problemaMedicamento.create({
    data: {
      atendimentoId,
      pacienteId,
      medicamentoEmUsoId: medicamentoEmUsoId ?? null,
      categoria,
      descricao,
      gravidade,
      status: 'IDENTIFICADO',
    },
    include: {
      medicamentoEmUso: { select: { id: true, nomeCustom: true, medicamento: { select: { nome: true } } } },
    },
  })

  return NextResponse.json(problema, { status: 201 })
}
