import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth'
import { prisma } from '@/app/lib/prisma'

async function getMedicamentoComPermissao(id: string, usuarioId: string) {
  return prisma.medicamentoEmUso.findFirst({
    where: {
      id,
      paciente: { usuarioId },
    },
    include: { medicamento: { select: { id: true, nome: true } } },
  })
}

// GET /api/medicamentos-em-uso/[id]
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const medicamento = await getMedicamentoComPermissao(params.id, session.user.id)
  if (!medicamento) {
    return NextResponse.json({ error: 'Medicamento não encontrado' }, { status: 404 })
  }

  return NextResponse.json(medicamento)
}

// PUT /api/medicamentos-em-uso/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const med = await getMedicamentoComPermissao(params.id, session.user.id)
  if (!med) {
    return NextResponse.json({ error: 'Medicamento não encontrado' }, { status: 404 })
  }

  const body = await request.json()

  const updated = await prisma.medicamentoEmUso.update({
    where: { id: params.id },
    data: {
      medicamentoId: body.medicamentoId ?? med.medicamentoId,
      nomeCustom: body.nomeCustom ?? med.nomeCustom,
      dose: body.dose ?? med.dose,
      formaFarmaceutica: body.formaFarmaceutica ?? med.formaFarmaceutica,
      viaAdministracao: body.viaAdministracao ?? med.viaAdministracao,
      frequencia: body.frequencia ?? med.frequencia,
      quantidadePorDose: body.quantidadePorDose ?? med.quantidadePorDose,
      horarios: body.horarios ?? med.horarios,
      indicacao: body.indicacao ?? med.indicacao,
      origem: body.origem ?? med.origem,
      dataInicio: body.dataInicio ? new Date(body.dataInicio) : med.dataInicio,
      dataTermino: body.dataTermino ? new Date(body.dataTermino) : med.dataTermino,
      status: body.status ?? med.status,
    },
    include: { medicamento: { select: { id: true, nome: true } } },
  })

  return NextResponse.json(updated)
}

// DELETE /api/medicamentos-em-uso/[id]
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const med = await getMedicamentoComPermissao(params.id, session.user.id)
  if (!med) {
    return NextResponse.json({ error: 'Medicamento não encontrado' }, { status: 404 })
  }

  await prisma.medicamentoEmUso.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
