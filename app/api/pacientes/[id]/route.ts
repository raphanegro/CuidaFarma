import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { validarCPF, limparCPF } from '@/lib/cpf'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: params.id },
      include: {
        analises: true,
        intervencoes: true,
        atendimentos: {
          orderBy: { dataAtendimento: 'desc' },
          take: 10,
        },
        historicoClinico: {
          orderBy: { criadoEm: 'desc' },
        },
      },
    })

    if (!paciente) {
      return NextResponse.json({ error: 'Paciente not found' }, { status: 404 })
    }

    if (paciente.usuarioId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(paciente)
  } catch (error) {
    console.error('Paciente GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: params.id },
    })

    if (!paciente) {
      return NextResponse.json({ error: 'Paciente not found' }, { status: 404 })
    }

    if (paciente.usuarioId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Se CPF foi enviado, validar e limpar
    if (body.cpf !== undefined) {
      const cpfLimpo = limparCPF(body.cpf)
      if (!validarCPF(cpfLimpo)) {
        return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
      }
      // Checar unicidade somente se CPF mudou
      if (cpfLimpo !== paciente.cpf) {
        const existing = await prisma.paciente.findUnique({ where: { cpf: cpfLimpo } })
        if (existing) {
          return NextResponse.json({ error: 'CPF já cadastrado para outro paciente' }, { status: 400 })
        }
      }
      body.cpf = cpfLimpo
    }

    const updated = await prisma.paciente.update({
      where: { id: params.id },
      data: {
        nome: body.nome,
        sobrenome: body.sobrenome,
        cpf: body.cpf,
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : undefined,
        genero: body.genero,
        telefone: body.telefone ?? undefined,
        telefoneSecundario: body.telefoneSecundario ?? undefined,
        email: body.email ?? undefined,
        endereco: body.endereco ?? undefined,
        cidade: body.cidade ?? undefined,
        estado: body.estado ?? undefined,
        cep: body.cep ?? undefined,
        unidadeSaude: body.unidadeSaude ?? undefined,
        profissionalResponsavel: body.profissionalResponsavel ?? undefined,
        notas: body.notas ?? undefined,
        ativo: body.ativo ?? undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Paciente PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: params.id },
    })

    if (!paciente) {
      return NextResponse.json({ error: 'Paciente not found' }, { status: 404 })
    }

    if (paciente.usuarioId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.paciente.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Paciente DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
