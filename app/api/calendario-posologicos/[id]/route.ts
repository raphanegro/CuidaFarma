import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const calendario = await prisma.calendarioPosologico.findUnique({ where: { id: params.id } })
  if (!calendario) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(calendario)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const calendario = await prisma.calendarioPosologico.update({ where: { id: params.id }, data: body })
  return NextResponse.json(calendario)
}
