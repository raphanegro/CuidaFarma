export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { estado, justificativaIgnorado } = await request.json() as {
    estado: string
    justificativaIgnorado?: string
  }

  // ALTO-06: validar ownership do alerta antes de atualizar
  const alerta = await prisma.alertaClinico.findUnique({
    where: { id: params.id },
    include: { paciente: { select: { usuarioId: true } } },
  })
  if (!alerta) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })

  if (session.user.role !== 'ADMIN' && alerta.paciente.usuarioId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const atualizado = await prisma.alertaClinico.update({
    where: { id: params.id },
    data: { estado, justificativaIgnorado: justificativaIgnorado ?? null },
  })
  return NextResponse.json(atualizado)
}
