import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const calendarioSchema = z.object({
  atendimentoId: z.string(),
  horarios: z.record(z.array(z.string())),
  observacoes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = calendarioSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })

  const calendario = await prisma.calendarioPosologico.upsert({
    where: { atendimentoId: result.data.atendimentoId },
    update: result.data,
    create: result.data,
  })

  return NextResponse.json(calendario, { status: 201 })
}
