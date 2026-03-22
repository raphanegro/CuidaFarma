import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const medicamentoSchema = z.object({
  pacienteId: z.string(),
  nomeGenerico: z.string().min(2),
  dose: z.string().min(1),
  formaFarmaceutica: z.string().optional(),
  viaAdministracao: z.string().optional(),
  frequencia: z.string().min(1),
  indicacao: z.string().optional(),
  origem: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('pacienteId')

  const medicamentos = await prisma.medicamentoUso.findMany({
    where: { ...(pacienteId ? { pacienteId } : {}), ativo: true },
    orderBy: { nomeGenerico: 'asc' },
  })

  return NextResponse.json(medicamentos)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = medicamentoSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const medicamento = await prisma.medicamentoUso.create({ data: result.data })
  return NextResponse.json(medicamento, { status: 201 })
}
