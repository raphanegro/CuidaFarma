import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const notificacaoSchema = z.object({
  usuarioId: z.string(),
  titulo: z.string(),
  mensagem: z.string(),
  tipo: z.string(),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = notificacaoSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })

  const notificacao = await prisma.notificacao.create({ data: result.data })
  return NextResponse.json(notificacao, { status: 201 })
}
