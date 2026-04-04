import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth'
import { prisma } from '@/app/lib/prisma'

async function getPrmComPermissao(id: string, usuarioId: string) {
  return prisma.problemaMedicamento.findFirst({
    where: {
      id,
      paciente: { usuarioId },
    },
    include: {
      medicamentoEmUso: { select: { id: true, nomeCustom: true, medicamento: { select: { nome: true } } } },
    },
  })
}

// GET /api/prm/[id]
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const prm = await getPrmComPermissao(params.id, session.user.id)
  if (!prm) {
    return NextResponse.json({ error: 'PRM não encontrado' }, { status: 404 })
  }

  return NextResponse.json(prm)
}

// PATCH /api/prm/[id] — atualiza status, gravidade ou descrição
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const prm = await getPrmComPermissao(params.id, session.user.id)
  if (!prm) {
    return NextResponse.json({ error: 'PRM não encontrado' }, { status: 404 })
  }

  const body = await request.json()

  const updated = await prisma.problemaMedicamento.update({
    where: { id: params.id },
    data: {
      status: body.status ?? prm.status,
      gravidade: body.gravidade ?? prm.gravidade,
      descricao: body.descricao ?? prm.descricao,
      medicamentoEmUsoId: body.medicamentoEmUsoId ?? prm.medicamentoEmUsoId,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/prm/[id]
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const prm = await getPrmComPermissao(params.id, session.user.id)
  if (!prm) {
    return NextResponse.json({ error: 'PRM não encontrado' }, { status: 404 })
  }

  await prisma.problemaMedicamento.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
