import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const atendimento = await prisma.atendimento.findUnique({
      where: { id: params.id },
      include: {
        paciente: {
          select: { id: true, nome: true, sobrenome: true, cpf: true, dataNascimento: true },
        },
        dadosClinicos: true,
      },
    })

    if (!atendimento) {
      return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 })
    }

    if (atendimento.usuarioId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(atendimento)
  } catch (error) {
    console.error('Atendimento GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const atendimento = await prisma.atendimento.findUnique({
      where: { id: params.id },
    })

    if (!atendimento) {
      return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 })
    }

    if (atendimento.usuarioId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const updated = await prisma.atendimento.update({
      where: { id: params.id },
      data: {
        status: body.status ?? undefined,
        motivoDescricao: body.motivoDescricao ?? undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Atendimento PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
