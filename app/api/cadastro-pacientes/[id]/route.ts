import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pacienteSchema } from '@/lib/validations/paciente'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const paciente = await prisma.paciente.findUnique({
    where: { id: params.id },
    include: {
      atendimentos: { orderBy: { createdAt: 'desc' } },
      medicamentos: true,
      historicoClinicos: true,
    },
  })

  if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
  return NextResponse.json(paciente)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = pacienteSchema.partial().safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const paciente = await prisma.paciente.update({
    where: { id: params.id },
    data: result.data.dataNascimento
      ? { ...result.data, dataNascimento: new Date(result.data.dataNascimento) }
      : result.data,
  })

  return NextResponse.json(paciente)
}
