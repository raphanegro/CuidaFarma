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
    const pacienteId = searchParams.get('pacienteId')

    if (!pacienteId) {
      return NextResponse.json({ error: 'pacienteId é obrigatório' }, { status: 400 })
    }

    // Verificar que paciente pertence ao usuário
    const paciente = await prisma.paciente.findFirst({
      where: { id: pacienteId, usuarioId: session.user.id },
    })
    if (!paciente) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    const historico = await prisma.historicoClinico.findMany({
      where: { pacienteId },
      orderBy: [{ status: 'asc' }, { dataDiagnostico: 'desc' }, { criadoEm: 'desc' }],
    })

    return NextResponse.json(historico)
  } catch (error) {
    console.error('HistoricoClinico GET error:', error)
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
    if (!body.doenca || !body.doenca.trim()) {
      return NextResponse.json({ error: 'Nome da doença é obrigatório' }, { status: 400 })
    }

    // Verificar que paciente pertence ao usuário
    const paciente = await prisma.paciente.findFirst({
      where: { id: body.pacienteId, usuarioId: session.user.id },
    })
    if (!paciente) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    const historico = await prisma.historicoClinico.create({
      data: {
        pacienteId: body.pacienteId,
        doenca: body.doenca.trim(),
        cid10: body.cid10 || null,
        dataDiagnostico: body.dataDiagnostico ? new Date(body.dataDiagnostico) : null,
        status: body.status || 'ATIVA',
        observacoes: body.observacoes || null,
      },
    })

    return NextResponse.json(historico, { status: 201 })
  } catch (error) {
    console.error('HistoricoClinico POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
