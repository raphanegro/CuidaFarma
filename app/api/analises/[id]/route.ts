import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export async function GET(
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

    const analise = await prisma.analiseFarmacoTerapeutica.findUnique({
      where: { id: params.id },
      include: {
        paciente: true,
        medicamento: true,
        intervencoes: {
          select: {
            id: true,
            tipo: true,
            descricao: true,
            status: true,
            dataSugestao: true,
          }
        }
      }
    })

    if (!analise) {
      return NextResponse.json(
        { error: 'Análise não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(analise)
  } catch (error) {
    console.error('Análise GET error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar análise' },
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
    const { tipo, descricao, achados, recomendacoes, status } = body

    // Validações
    if (!tipo || !descricao) {
      return NextResponse.json(
        { error: 'Tipo e descrição são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se análise existe
    const analise = await prisma.analiseFarmacoTerapeutica.findUnique({
      where: { id: params.id },
    })

    if (!analise) {
      return NextResponse.json(
        { error: 'Análise não encontrada' },
        { status: 404 }
      )
    }

    const updatedAnalise = await prisma.analiseFarmacoTerapeutica.update({
      where: { id: params.id },
      data: {
        tipo,
        descricao,
        achados: achados || [],
        recomendacoes: recomendacoes || [],
        status: status || analise.status,
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

    return NextResponse.json({
      message: 'Análise atualizada com sucesso',
      analise: updatedAnalise,
    })
  } catch (error) {
    console.error('Análise PUT error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar análise' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const analise = await prisma.analiseFarmacoTerapeutica.findUnique({
      where: { id: params.id },
    })

    if (!analise) {
      return NextResponse.json(
        { error: 'Análise não encontrada' },
        { status: 404 }
      )
    }

    // Delete related intervencoes first (cascade)
    await prisma.intervencao.deleteMany({
      where: { analiseId: params.id },
    })

    // Delete related anexos (cascade)
    await prisma.anexo.deleteMany({
      where: { analiseId: params.id },
    })

    await prisma.analiseFarmacoTerapeutica.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Análise deletada com sucesso',
    })
  } catch (error) {
    console.error('Análise DELETE error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar análise' },
      { status: 500 }
    )
  }
}
