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

  const calendarios = await prisma.calendarioPosologico.findMany({
    where: { pacienteId },
    orderBy: { geradoEm: 'desc' },
  })

  return NextResponse.json(calendarios)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { pacienteId, atendimentoId, itens, observacoes } = body

  if (!pacienteId || !itens) return NextResponse.json({ error: 'pacienteId e itens são obrigatórios' }, { status: 400 })

  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, usuarioId: session.user.id } })
  if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

  const calendario = await prisma.calendarioPosologico.create({
    data: { pacienteId, atendimentoId: atendimentoId || null, itens, observacoes: observacoes || null },
  })

  return NextResponse.json(calendario, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, itens, observacoes } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const existing = await prisma.calendarioPosologico.findFirst({
    where: { id, paciente: { usuarioId: session.user.id } },
  })
  if (!existing) return NextResponse.json({ error: 'Calendário não encontrado' }, { status: 404 })

  const updated = await prisma.calendarioPosologico.update({
    where: { id },
    data: { itens: itens ?? existing.itens, observacoes: observacoes ?? existing.observacoes },
  })

  return NextResponse.json(updated)
}
