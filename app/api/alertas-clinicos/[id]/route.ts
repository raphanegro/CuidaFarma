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

  const { estado, justificativaIgnorado } = await request.json()

  const alerta = await prisma.alertaClinico.update({
    where: { id: params.id },
    data: { estado, justificativaIgnorado: justificativaIgnorado ?? null },
  })
  return NextResponse.json(alerta)
}
