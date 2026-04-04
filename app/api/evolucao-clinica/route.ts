export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('pacienteId')
  const atendimentoId = searchParams.get('atendimentoId')

  if (!pacienteId && !atendimentoId) {
    return NextResponse.json({ error: 'Informe pacienteId ou atendimentoId' }, { status: 400 })
  }

  const evolucoes = await prisma.evolucaoClinica.findMany({
    where: {
      ...(pacienteId ? { pacienteId, paciente: { usuarioId: session.user.id } } : {}),
      ...(atendimentoId ? { atendimentoId, atendimento: { paciente: { usuarioId: session.user.id } } } : {}),
    },
    include: {
      atendimento: { select: { id: true, tipo: true, dataAtendimento: true, dadosClinicos: true } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(evolucoes)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { atendimentoId, pacienteId, adesao, adesaoObs, evolucaoTexto, resolucaoPrms } = body

  if (!atendimentoId || !pacienteId) {
    return NextResponse.json({ error: 'atendimentoId e pacienteId são obrigatórios' }, { status: 400 })
  }

  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, paciente: { usuarioId: session.user.id } },
  })
  if (!atendimento) return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 })

  // Verificar se já existe evolução para este atendimento
  const existente = await prisma.evolucaoClinica.findUnique({ where: { atendimentoId } })
  if (existente) {
    // Atualizar se já existe
    const updated = await prisma.evolucaoClinica.update({
      where: { atendimentoId },
      data: {
        adesao: adesao || null,
        adesaoObs: adesaoObs || null,
        evolucaoTexto: evolucaoTexto || null,
        resolucaoPrms: resolucaoPrms || null,
      },
    })
    return NextResponse.json(updated)
  }

  const evolucao = await prisma.evolucaoClinica.create({
    data: {
      atendimentoId,
      pacienteId,
      adesao: adesao || null,
      adesaoObs: adesaoObs || null,
      evolucaoTexto: evolucaoTexto || null,
      resolucaoPrms: resolucaoPrms || null,
    },
  })

  return NextResponse.json(evolucao, { status: 201 })
}
