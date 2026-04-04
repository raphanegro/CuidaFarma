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
  if (!pacienteId) return NextResponse.json({ error: 'pacienteId obrigatório' }, { status: 400 })

  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, usuarioId: session.user.id } })
  if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

  const planos = await prisma.planoAcompanhamento.findMany({
    where: { pacienteId },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(planos)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { pacienteId, proximoRetorno, tipoAtendimentoProgramado, monitoramentos, observacoes } = body

  if (!pacienteId) return NextResponse.json({ error: 'pacienteId obrigatório' }, { status: 400 })

  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, usuarioId: session.user.id } })
  if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

  const plano = await prisma.planoAcompanhamento.create({
    data: {
      pacienteId,
      proximoRetorno: proximoRetorno ? new Date(proximoRetorno) : null,
      tipoAtendimentoProgramado: tipoAtendimentoProgramado || null,
      monitoramentos: monitoramentos || null,
      observacoes: observacoes || null,
    },
  })

  return NextResponse.json(plano, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, proximoRetorno, tipoAtendimentoProgramado, monitoramentos, observacoes } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const existing = await prisma.planoAcompanhamento.findFirst({
    where: { id, paciente: { usuarioId: session.user.id } },
  })
  if (!existing) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })

  const updated = await prisma.planoAcompanhamento.update({
    where: { id },
    data: {
      proximoRetorno: proximoRetorno !== undefined ? (proximoRetorno ? new Date(proximoRetorno) : null) : existing.proximoRetorno,
      tipoAtendimentoProgramado: tipoAtendimentoProgramado ?? existing.tipoAtendimentoProgramado,
      monitoramentos: monitoramentos ?? existing.monitoramentos,
      observacoes: observacoes ?? existing.observacoes,
    },
  })

  return NextResponse.json(updated)
}
