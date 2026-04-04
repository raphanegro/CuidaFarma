import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth'
import { prisma } from '@/app/lib/prisma'
import { TipoExame } from '@prisma/client'

// GET /api/exames?pacienteId=&tipo=
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('pacienteId')
  const tipo = searchParams.get('tipo') as TipoExame | null

  if (!pacienteId) {
    return NextResponse.json({ error: 'pacienteId obrigatório' }, { status: 400 })
  }

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, usuarioId: session.user.id },
    select: { id: true },
  })
  if (!paciente) {
    return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
  }

  const exames = await prisma.resultadoExame.findMany({
    where: {
      pacienteId,
      ...(tipo ? { tipo } : {}),
    },
    orderBy: { dataColeta: 'desc' },
  })

  return NextResponse.json(exames)
}

// POST /api/exames
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { pacienteId, tipo, tipoCustom, valor, unidade, dataColeta, laboratorio, refMin, refMax } = body

  if (!pacienteId || !tipo || valor === undefined || !unidade || !dataColeta) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: pacienteId, tipo, valor, unidade, dataColeta' },
      { status: 400 }
    )
  }

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, usuarioId: session.user.id },
    select: { id: true },
  })
  if (!paciente) {
    return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
  }

  const exame = await prisma.resultadoExame.create({
    data: {
      pacienteId,
      tipo,
      tipoCustom: tipo === 'OUTRO' ? tipoCustom : null,
      valor,
      unidade,
      dataColeta: new Date(dataColeta),
      laboratorio: laboratorio ?? null,
      refMin: refMin ?? null,
      refMax: refMax ?? null,
    },
  })

  return NextResponse.json(exame, { status: 201 })
}
