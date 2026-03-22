import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notificacao = await prisma.notificacao.findUnique({ where: { id: params.id } })
  if (!notificacao) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(notificacao)
}
