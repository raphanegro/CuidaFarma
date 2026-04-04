export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

async function checkOwnership(id: string, userId: string) {
  return prisma.intervencao.findFirst({
    where: { id, paciente: { usuarioId: userId } },
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const existing = await checkOwnership(params.id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Intervenção não encontrada' }, { status: 404 })

  const body = await request.json()
  const { tipo, descricao, justificativa, resultadoEsperado, status, resultado, dataImplementacao, prmId } = body

  const updated = await prisma.intervencao.update({
    where: { id: params.id },
    data: {
      ...(tipo && { tipo }),
      ...(descricao && { descricao }),
      ...(justificativa && { justificativa }),
      resultadoEsperado: resultadoEsperado ?? existing.resultadoEsperado,
      ...(status && { status }),
      resultado: resultado ?? existing.resultado,
      dataImplementacao: dataImplementacao ? new Date(dataImplementacao) : existing.dataImplementacao,
      prmId: prmId !== undefined ? (prmId || null) : existing.prmId,
    },
    include: {
      prm: { select: { id: true, descricao: true, categoria: true, gravidade: true } },
      usuario: { select: { id: true, nome: true, sobrenome: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const existing = await checkOwnership(params.id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Intervenção não encontrada' }, { status: 404 })

  await prisma.intervencao.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
