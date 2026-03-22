import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const analiseSchema = z.object({
  atendimentoId: z.string(),
  interacoesMedicamentosas: z.boolean().default(false),
  duplicidadeTerapeutica: z.boolean().default(false),
  doseInadequada: z.boolean().default(false),
  condicaoClinicaInadequada: z.boolean().default(false),
  observacoes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const atendimentoId = searchParams.get('atendimentoId')

  const analises = await prisma.analiseFarmacoterapeutica.findMany({
    where: atendimentoId ? { atendimentoId } : {},
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(analises)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = analiseSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })

  const analise = await prisma.analiseFarmacoterapeutica.upsert({
    where: { atendimentoId: result.data.atendimentoId },
    update: result.data,
    create: result.data,
  })

  return NextResponse.json(analise, { status: 201 })
}
