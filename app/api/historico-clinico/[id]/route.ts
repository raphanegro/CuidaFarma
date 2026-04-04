export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

async function getHistoricoComPermissao(id: string, userId: string, role: string) {
  const historico = await prisma.historicoClinico.findUnique({
    where: { id },
    include: {
      paciente: { select: { usuarioId: true } },
    },
  })

  if (!historico) return null
  if (historico.paciente.usuarioId !== userId && role !== 'ADMIN') return null
  return historico
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const historico = await getHistoricoComPermissao(params.id, session.user.id, session.user.role)
    if (!historico) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
    }

    const body = await request.json()

    const updated = await prisma.historicoClinico.update({
      where: { id: params.id },
      data: {
        doenca: body.doenca ?? undefined,
        cid10: body.cid10 ?? undefined,
        dataDiagnostico: body.dataDiagnostico ? new Date(body.dataDiagnostico) : undefined,
        status: body.status ?? undefined,
        observacoes: body.observacoes ?? undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('HistoricoClinico PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const historico = await getHistoricoComPermissao(params.id, session.user.id, session.user.role)
    if (!historico) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
    }

    await prisma.historicoClinico.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('HistoricoClinico DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
