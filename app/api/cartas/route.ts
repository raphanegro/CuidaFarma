export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pacienteId = request.nextUrl.searchParams.get('pacienteId')
  if (!pacienteId) return NextResponse.json({ error: 'pacienteId required' }, { status: 400 })

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

  const body = await request.json()
  const carta = await prisma.cartaPrescritor.create({
    data: {
      pacienteId: body.pacienteId,
      usuarioId: session.user.id,
      destinatario: body.destinatario,
      assunto: body.assunto,
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

  await prisma.cartaPrescritor.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
