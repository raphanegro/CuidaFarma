import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  nomeGenerico: z.string().optional(),
  dose: z.string().optional(),
  frequencia: z.string().optional(),
  ativo: z.boolean().optional(),
})

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const med = await prisma.medicamentoUso.findUnique({ where: { id: params.id } })
  if (!med) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(med)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = updateSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })

  const med = await prisma.medicamentoUso.update({ where: { id: params.id }, data: result.data })
  return NextResponse.json(med)
}
