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

  // ALTO-03: validar ownership do paciente
  const autorizado = await verificarOwnershipPaciente(pacienteId, session.user.id, session.user.role === 'ADMIN')
  if (!autorizado) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tarefas = await prisma.tarefaPaciente.findMany({
    where: { pacienteId },
    orderBy: [{ concluida: 'asc' }, { prioridade: 'asc' }, { criadoEm: 'desc' }],
  })
  return NextResponse.json(tarefas)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    pacienteId: string
    descricao: string
    prioridade?: string
    prazo?: string | null
  }

  const autorizado = await verificarOwnershipPaciente(body.pacienteId, session.user.id, session.user.role === 'ADMIN')
  if (!autorizado) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

  const body = await request.json() as {
    id: string
    descricao?: string
    prioridade?: string
    prazo?: string | null
    concluida?: boolean
  }

  // Validar ownership via tarefa → paciente
  const tarefa = await prisma.tarefaPaciente.findUnique({
    where: { id: body.id },
    include: { paciente: { select: { usuarioId: true } } },
  })
  if (!tarefa) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })

  if (session.user.role !== 'ADMIN' && tarefa.paciente.usuarioId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const atualizada = await prisma.tarefaPaciente.update({
    where: { id: body.id },
    data: {
      descricao: body.descricao,
      prioridade: body.prioridade,
      prazo: body.prazo ? new Date(body.prazo) : null,
      concluida: body.concluida,
    },
  })
  return NextResponse.json(atualizada)
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // ALTO-04: validar ownership antes de deletar
  const tarefa = await prisma.tarefaPaciente.findUnique({
    where: { id },
    include: { paciente: { select: { usuarioId: true } } },
  })
  if (!tarefa) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })

  if (session.user.role !== 'ADMIN' && tarefa.paciente.usuarioId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.tarefaPaciente.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
