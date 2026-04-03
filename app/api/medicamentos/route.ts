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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const medicamentos = await prisma.medicamento.findMany({
      where: search ? {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { principioAtivo: { contains: search, mode: 'insensitive' } },
          { codigoATC: { contains: search, mode: 'insensitive' } },
        ]
      } : undefined,
      skip,
      take: limit,
      orderBy: { nome: 'asc' },
    })

    const total = await prisma.medicamento.count({
      where: search ? {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { principioAtivo: { contains: search, mode: 'insensitive' } },
          { codigoATC: { contains: search, mode: 'insensitive' } },
        ]
      } : undefined,
    })

    return NextResponse.json({
      medicamentos,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Medicamentos GET error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar medicamentos' },
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
    const { nome, principioAtivo, dosagem, forma, fabricante, codigoATC } = body

    // Validações
    if (!nome || !principioAtivo || !dosagem || !forma) {
      return NextResponse.json(
        { error: 'Nome, princípio ativo, dosagem e forma são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se medicamento já existe
    const existingMedicamento = await prisma.medicamento.findUnique({
      where: { nome },
    })

    if (existingMedicamento) {
      return NextResponse.json(
        { error: 'Este medicamento já está registrado' },
        { status: 400 }
      )
    }

    const medicamento = await prisma.medicamento.create({
      data: {
        nome,
        principioAtivo,
        dosagem,
        forma,
        fabricante: fabricante || null,
        codigoATC: codigoATC || null,
      },
    })

    return NextResponse.json(
      {
        message: 'Medicamento criado com sucesso',
        medicamento,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Medicamentos POST error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar medicamento' },
      { status: 500 }
    )
  }
}
