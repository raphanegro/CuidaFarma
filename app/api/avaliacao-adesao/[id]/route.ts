import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth'
import { prisma } from '@/app/lib/prisma'

// DELETE /api/avaliacao-adesao/[id]
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const avaliacao = await prisma.avaliacaoAdesao.findFirst({
    where: { id: params.id, paciente: { usuarioId: session.user.id } },
  })
  if (!avaliacao) {
    return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
  }

  await prisma.avaliacaoAdesao.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
