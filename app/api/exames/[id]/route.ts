import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth'
import { prisma } from '@/app/lib/prisma'

async function getExameComPermissao(id: string, usuarioId: string) {
  return prisma.resultadoExame.findFirst({
    where: {
      id,
      paciente: { usuarioId },
    },
    include: { paciente: { select: { id: true } } },
  })
}

// GET /api/exames/[id]
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const exame = await getExameComPermissao(params.id, session.user.id)
  if (!exame) {
    return NextResponse.json({ error: 'Exame não encontrado' }, { status: 404 })
  }

  return NextResponse.json(exame)
}

// PUT /api/exames/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const exame = await getExameComPermissao(params.id, session.user.id)
  if (!exame) {
    return NextResponse.json({ error: 'Exame não encontrado' }, { status: 404 })
  }

  const body = await request.json()

  const updated = await prisma.resultadoExame.update({
    where: { id: params.id },
    data: {
      tipo: body.tipo ?? exame.tipo,
      tipoCustom: body.tipoCustom ?? null,
      valor: body.valor ?? exame.valor,
      unidade: body.unidade ?? exame.unidade,
      dataColeta: body.dataColeta ? new Date(body.dataColeta) : exame.dataColeta,
      laboratorio: body.laboratorio ?? null,
      refMin: body.refMin ?? null,
      refMax: body.refMax ?? null,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/exames/[id]
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const exame = await getExameComPermissao(params.id, session.user.id)
  if (!exame) {
    return NextResponse.json({ error: 'Exame não encontrado' }, { status: 404 })
  }

  await prisma.resultadoExame.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
