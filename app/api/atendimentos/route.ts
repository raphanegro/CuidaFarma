import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pacienteId = searchParams.get('pacienteId') || ''

    const where: Record<string, unknown> = { usuarioId: session.user.id }
    if (pacienteId) {
      where.pacienteId = pacienteId
    }

    const atendimentos = await prisma.atendimento.findMany({
      where,
      include: {
        paciente: {
          select: { id: true, nome: true, sobrenome: true, cpf: true },
        },
        dadosClinicos: true,
      },
      orderBy: { dataAtendimento: 'desc' },
    })

    return NextResponse.json(atendimentos)
  } catch (error) {
    console.error('Atendimentos GET error:', error)
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

    if (!body.pacienteId) {
      return NextResponse.json({ error: 'pacienteId é obrigatório' }, { status: 400 })
    }
    if (!body.tipo) {
      return NextResponse.json({ error: 'tipo de atendimento é obrigatório' }, { status: 400 })
    }

    // Verificar que paciente pertence ao usuário
    const paciente = await prisma.paciente.findFirst({
      where: { id: body.pacienteId, usuarioId: session.user.id },
    })
    if (!paciente) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    const atendimento = await prisma.atendimento.create({
      data: {
        pacienteId: body.pacienteId,
        usuarioId: session.user.id,
        tipo: body.tipo,
        enderecoVisita: body.tipo === 'VISITA_DOMICILIAR' ? (body.enderecoVisita || null) : null,
        motivoConsulta: body.motivoConsulta || [],
        motivoDescricao: body.motivoDescricao || null,
        dataAtendimento: body.dataAtendimento ? new Date(body.dataAtendimento) : new Date(),
      },
      include: {
        paciente: {
          select: { id: true, nome: true, sobrenome: true, cpf: true },
        },
      },
    })

    return NextResponse.json(atendimento, { status: 201 })
  } catch (error) {
    console.error('Atendimentos POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
