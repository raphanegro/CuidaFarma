export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('pacienteId')

  if (!pacienteId) return NextResponse.json({ error: 'pacienteId obrigatório' }, { status: 400 })

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, usuarioId: session.user.id },
  })
  if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

  const intervencoes = await prisma.intervencao.findMany({
    where: { pacienteId },
    include: {
      prm: { select: { id: true, descricao: true, categoria: true, gravidade: true } },
      usuario: { select: { id: true, nome: true, sobrenome: true } },
    },
    orderBy: { dataSugestao: 'desc' },
  })

  return NextResponse.json(intervencoes)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { pacienteId, tipo, descricao, justificativa, resultadoEsperado, status, prmId, dataSugestao } = body

  if (!pacienteId || !tipo || !descricao || !justificativa) {
    return NextResponse.json({ error: 'pacienteId, tipo, descricao e justificativa são obrigatórios' }, { status: 400 })
  }

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, usuarioId: session.user.id },
  })
  if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

  const intervencao = await prisma.intervencao.create({
    data: {
      pacienteId,
      usuarioId: session.user.id,
      tipo,
      descricao,
      justificativa,
      resultadoEsperado: resultadoEsperado || null,
      status: status || 'PENDING',
      prmId: prmId || null,
      dataSugestao: dataSugestao ? new Date(dataSugestao) : new Date(),
    },
    include: {
      prm: { select: { id: true, descricao: true, categoria: true, gravidade: true } },
      usuario: { select: { id: true, nome: true, sobrenome: true } },
    },
  })

  return NextResponse.json(intervencao, { status: 201 })
}
