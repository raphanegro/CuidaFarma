export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

async function verificarOwnershipPaciente(pacienteId: string, usuarioId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    select: { usuarioId: true },
  })
  return paciente?.usuarioId === usuarioId
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pacienteId = request.nextUrl.searchParams.get('pacienteId')
  if (!pacienteId) return NextResponse.json({ error: 'pacienteId required' }, { status: 400 })

  // ALTO-01: validar ownership do paciente
  const autorizado = await verificarOwnershipPaciente(pacienteId, session.user.id, session.user.role === 'ADMIN')
  if (!autorizado) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cartas = await prisma.cartaPrescritor.findMany({
    where: { pacienteId },
    include: { usuario: { select: { nome: true, sobrenome: true } } },
    orderBy: { criadoEm: 'desc' },
  })
  return NextResponse.json(cartas)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    pacienteId: string
    destinatario: string
    assunto?: string
    corpo: string
    template?: string
  }

  const autorizado = await verificarOwnershipPaciente(body.pacienteId, session.user.id, session.user.role === 'ADMIN')
  if (!autorizado) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const carta = await prisma.cartaPrescritor.create({
    data: {
      pacienteId: body.pacienteId,
      usuarioId: session.user.id,
      destinatario: body.destinatario,
      assunto: body.assunto ?? '',
      corpo: body.corpo,
      template: body.template ?? null,
    },
  })
  return NextResponse.json(carta, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // ALTO-02: validar ownership da carta antes de deletar
  const carta = await prisma.cartaPrescritor.findUnique({
    where: { id },
    include: { paciente: { select: { usuarioId: true } } },
  })
  if (!carta) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })

  if (session.user.role !== 'ADMIN' && carta.paciente.usuarioId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.cartaPrescritor.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
