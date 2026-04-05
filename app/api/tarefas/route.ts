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

  const tarefas = await prisma.tarefaPaciente.findMany({
    where: { pacienteId },
    orderBy: [{ concluida: 'asc' }, { prioridade: 'asc' }, { criadoEm: 'desc' }],
  })
  return NextResponse.json(tarefas)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const tarefa = await prisma.tarefaPaciente.create({
    data: {
      pacienteId: body.pacienteId,
      usuarioId: session.user.id,
      descricao: body.descricao,
      prioridade: body.prioridade ?? 'MEDIA',
      prazo: body.prazo ? new Date(body.prazo) : null,
    },
  })
  return NextResponse.json(tarefa, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const tarefa = await prisma.tarefaPaciente.update({
    where: { id: body.id },
    data: {
      descricao: body.descricao,
      prioridade: body.prioridade,
      prazo: body.prazo ? new Date(body.prazo) : null,
      concluida: body.concluida,
    },
  })
  return NextResponse.json(tarefa)
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.tarefaPaciente.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
