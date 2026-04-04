export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { StatusMedicamento } from '@prisma/client'

// GET /api/medicamentos-em-uso?pacienteId=&status=
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('pacienteId')
  const statusParam = searchParams.get('status') as StatusMedicamento | null

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

  const medicamentos = await prisma.medicamentoEmUso.findMany({
    where: {
      pacienteId,
      ...(statusParam ? { status: statusParam } : {}),
    },
    include: { medicamento: { select: { id: true, nome: true, principioAtivo: true } } },
    orderBy: [{ status: 'asc' }, { dataInicio: 'desc' }],
  })

  return NextResponse.json(medicamentos)
}

// POST /api/medicamentos-em-uso
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const {
    pacienteId,
    medicamentoId,
    nomeCustom,
    dose,
    formaFarmaceutica,
    viaAdministracao,
    frequencia,
    quantidadePorDose,
    horarios,
    indicacao,
    origem,
    dataInicio,
    dataTermino,
    status,
  } = body

  if (!pacienteId || !origem || !dataInicio) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: pacienteId, origem, dataInicio' },
      { status: 400 }
    )
  }

  if (!medicamentoId && !nomeCustom) {
    return NextResponse.json(
      { error: 'Informe medicamentoId (catálogo) ou nomeCustom (texto livre)' },
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

  const medicamento = await prisma.medicamentoEmUso.create({
    data: {
      pacienteId,
      medicamentoId: medicamentoId ?? null,
      nomeCustom: nomeCustom ?? null,
      dose: dose ?? null,
      formaFarmaceutica: formaFarmaceutica ?? null,
      viaAdministracao: viaAdministracao ?? null,
      frequencia: frequencia ?? null,
      quantidadePorDose: quantidadePorDose ?? 1,
      horarios: horarios ?? null,
      indicacao: indicacao ?? null,
      origem,
      dataInicio: new Date(dataInicio),
      dataTermino: dataTermino ? new Date(dataTermino) : null,
      status: status ?? 'EM_USO',
    },
    include: { medicamento: { select: { id: true, nome: true } } },
  })

  return NextResponse.json(medicamento, { status: 201 })
}
