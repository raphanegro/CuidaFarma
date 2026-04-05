export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

async function getPrfComPermissao(id: string, usuarioId: string) {
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

// GET /api/prf/[id]
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const prf = await getPrfComPermissao(params.id, session.user.id)
  if (!prf) {
    return NextResponse.json({ error: 'PRF não encontrado' }, { status: 404 })
  }

  return NextResponse.json(prf)
}

// PATCH /api/prf/[id] — atualiza status, gravidade ou descrição
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const prf = await getPrfComPermissao(params.id, session.user.id)
  if (!prf) {
    return NextResponse.json({ error: 'PRF não encontrado' }, { status: 404 })
  }

  const body = await request.json()

  const updated = await prisma.problemaMedicamento.update({
    where: { id: params.id },
    data: {
      status: body.status ?? prf.status,
      gravidade: body.gravidade ?? prf.gravidade,
      descricao: body.descricao ?? prf.descricao,
      medicamentoEmUsoId: body.medicamentoEmUsoId ?? prf.medicamentoEmUsoId,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/prf/[id]
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const prf = await getPrfComPermissao(params.id, session.user.id)
  if (!prf) {
    return NextResponse.json({ error: 'PRF não encontrado' }, { status: 404 })
  }

  await prisma.problemaMedicamento.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
