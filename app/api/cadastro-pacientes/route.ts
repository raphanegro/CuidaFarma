import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pacienteSchema } from '@/lib/validations/paciente'
import { validarCPF } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 20

  const where = search ? {
    OR: [
      { nome: { contains: search, mode: 'insensitive' as const } },
      { cpf: { contains: search.replace(/[^\d]/g, '') } },
    ]
  } : {}

  const [pacientes, total] = await Promise.all([
    prisma.paciente.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nome: 'asc' },
    }),
    prisma.paciente.count({ where }),
  ])

  return NextResponse.json({ pacientes, total, page, pageSize })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = pacienteSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const cpfLimpo = result.data.cpf.replace(/[^\d]/g, '')
  if (!validarCPF(cpfLimpo)) {
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
  }

  const existente = await prisma.paciente.findUnique({ where: { cpf: cpfLimpo } })
  if (existente) {
    return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 })
  }

  const paciente = await prisma.paciente.create({
    data: {
      ...result.data,
      cpf: cpfLimpo,
      dataNascimento: new Date(result.data.dataNascimento),
    },
  })

  return NextResponse.json(paciente, { status: 201 })
}
