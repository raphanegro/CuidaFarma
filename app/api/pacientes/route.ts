export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { validarCPF, limparCPF } from '@/lib/cpf'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const unidadeSaude = searchParams.get('unidadeSaude') || ''

    const where: Record<string, unknown> = { usuarioId: session.user.id }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { sobrenome: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: limparCPF(search) } },
      ]
    }

    if (unidadeSaude) {
      where.unidadeSaude = { contains: unidadeSaude, mode: 'insensitive' }
    }

    const pacientes = await prisma.paciente.findMany({
      where,
      select: {
        id: true,
        nome: true,
        sobrenome: true,
        cpf: true,
        email: true,
        telefone: true,
        dataNascimento: true,
        unidadeSaude: true,
        profissionalResponsavel: true,
        ativo: true,
      },
      orderBy: { criadoEm: 'desc' },
    })

    return NextResponse.json(pacientes)
  } catch (error) {
    console.error('Pacientes GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const cpfLimpo = limparCPF(body.cpf || '')

    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    const existingPaciente = await prisma.paciente.findUnique({
      where: { cpf: cpfLimpo },
    })

    if (existingPaciente) {
      return NextResponse.json(
        { error: 'Paciente com este CPF já existe' },
        { status: 400 }
      )
    }

    const paciente = await prisma.paciente.create({
      data: {
        nome: body.nome,
        sobrenome: body.sobrenome,
        cpf: cpfLimpo,
        dataNascimento: new Date(body.dataNascimento),
        genero: body.genero || '',
        telefone: body.telefone || null,
        telefoneSecundario: body.telefoneSecundario || null,
        email: body.email || null,
        endereco: body.endereco || null,
        cidade: body.cidade || null,
        estado: body.estado || null,
        cep: body.cep || null,
        unidadeSaude: body.unidadeSaude || null,
        profissionalResponsavel: body.profissionalResponsavel || null,
        condicoes: body.condicoes || [],
        alergias: body.alergias || [],
        medicacoes: body.medicacoes || [],
        notas: body.notas || null,
        usuarioId: session.user.id,
      },
    })

    return NextResponse.json(paciente, { status: 201 })
  } catch (error) {
    console.error('Pacientes POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
