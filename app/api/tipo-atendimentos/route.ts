import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tipoAtendimentoSchema = z.object({
  pacienteId: z.string(),
  tipoAtendimento: z.enum(['CONSULTA_UBS', 'CONSULTORIO_FARMACEUTICO', 'VISITA_DOMICILIAR', 'TELEATENDIMENTO']),
  motivoConsulta: z.string().optional(),
  detalhesVisita: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await request.json()
  const result = tipoAtendimentoSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })

  const atendimento = await prisma.atendimento.create({
    data: { ...result.data, usuarioId: userId },
  })

  return NextResponse.json(atendimento, { status: 201 })
}
