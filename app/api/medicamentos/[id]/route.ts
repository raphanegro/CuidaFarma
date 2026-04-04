export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const medicamento = await prisma.medicamento.findUnique({
      where: { id: params.id },
      include: {
        analises: {
          select: {
            id: true,
            data: true,
            tipo: true,
            status: true,
            paciente: {
              select: {
                id: true,
                nome: true,
                sobrenome: true,
              }
            }
          }
        }
      }
    })

    if (!medicamento) {
      return NextResponse.json(
        { error: 'Medicamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(medicamento)
  } catch (error) {
    console.error('Medicamento GET error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar medicamento' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar se medicamento existe
    const medicamento = await prisma.medicamento.findUnique({
      where: { id: params.id },
    })

    if (!medicamento) {
      return NextResponse.json(
        { error: 'Medicamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se novo nome já existe (caso tenha mudado)
    if (nome !== medicamento.nome) {
      const existingMedicamento = await prisma.medicamento.findUnique({
        where: { nome },
      })

      if (existingMedicamento) {
        return NextResponse.json(
          { error: 'Este nome de medicamento já está em uso' },
          { status: 400 }
        )
      }
    }

    const updatedMedicamento = await prisma.medicamento.update({
      where: { id: params.id },
      data: {
        nome,
        principioAtivo,
        dosagem,
        forma,
        fabricante: fabricante || null,
        codigoATC: codigoATC || null,
      },
    })

    return NextResponse.json({
      message: 'Medicamento atualizado com sucesso',
      medicamento: updatedMedicamento,
    })
  } catch (error) {
    console.error('Medicamento PUT error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar medicamento' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const medicamento = await prisma.medicamento.findUnique({
      where: { id: params.id },
      include: { analises: { select: { id: true } } }
    })

    if (!medicamento) {
      return NextResponse.json(
        { error: 'Medicamento não encontrado' },
        { status: 404 }
      )
    }

    if (medicamento.analises.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar medicamento com análises associadas' },
        { status: 400 }
      )
    }

    await prisma.medicamento.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Medicamento deletado com sucesso',
    })
  } catch (error) {
    console.error('Medicamento DELETE error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar medicamento' },
      { status: 500 }
    )
  }
}
