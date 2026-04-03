import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const pacienteId = searchParams.get('pacienteId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { tipo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (pacienteId) {
      where.pacienteId = pacienteId
    }

    if (status) {
      where.status = status
    }

    const analises = await prisma.analiseFarmacoTerapeutica.findMany({
      where,
      skip,
      take: limit,
      orderBy: { data: 'desc' },
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            sobrenome: true,
          }
        },
        medicamento: {
          select: {
            id: true,
            nome: true,
          }
        }
      }
    })

    const total = await prisma.analiseFarmacoTerapeutica.count({ where })

    return NextResponse.json({
      analises,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Análises GET error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar análises' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { pacienteId, medicamentoId, tipo, descricao, achados, recomendacoes, status } = body

    // Validações
    if (!pacienteId || !medicamentoId || !tipo || !descricao) {
      return NextResponse.json(
        { error: 'Paciente, medicamento, tipo e descrição são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
    })

    if (!paciente) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se medicamento existe
    const medicamento = await prisma.medicamento.findUnique({
      where: { id: medicamentoId },
    })

    if (!medicamento) {
      return NextResponse.json(
        { error: 'Medicamento não encontrado' },
        { status: 404 }
      )
    }

    const analise = await prisma.analiseFarmacoTerapeutica.create({
      data: {
        pacienteId,
        medicamentoId,
        tipo,
        descricao,
        achados: achados || [],
        recomendacoes: recomendacoes || [],
        status: status || 'pendente',
      },
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            sobrenome: true,
          }
        },
        medicamento: {
          select: {
            id: true,
            nome: true,
          }
        }
      }
    })

    return NextResponse.json(
      {
        message: 'Análise criada com sucesso',
        analise,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Análises POST error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar análise' },
      { status: 500 }
    )
  }
}
