export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/file-storage'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const anexo = await prisma.anexo.findUnique({
    where: { id: params.id },
    include: { paciente: { select: { usuarioId: true } } },
  })
  if (!anexo) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })

  // ALTO-05: validar que o anexo pertence a um paciente do usuario
  if (session.user.role !== 'ADMIN' && anexo.paciente.usuarioId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteFile(anexo.url)
  await prisma.anexo.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
