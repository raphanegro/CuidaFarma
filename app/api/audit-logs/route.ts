export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pacienteId = request.nextUrl.searchParams.get('pacienteId')
  const tipo = request.nextUrl.searchParams.get('tipo')
  const from = request.nextUrl.searchParams.get('from')
  const to = request.nextUrl.searchParams.get('to')

  const where: Record<string, unknown> = {}

  if (pacienteId) {
    // Não-admin só vê logs dos próprios pacientes
    if (session.user.role !== 'ADMIN') {
      const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId }, select: { usuarioId: true } })
      if (!paciente || paciente.usuarioId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    where.pacienteId = pacienteId
  } else if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (tipo) where.entidade = tipo
  if (from || to) {
    where.criadoEm = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { criadoEm: 'desc' },
    take: 100,
  })
  return NextResponse.json(logs)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const log = await prisma.auditLog.create({
    data: {
      acao: body.acao,
      entidade: body.entidade,
      entityId: body.entityId,
      dados: JSON.stringify(body.dados ?? {}),
      pacienteId: body.pacienteId,
      usuarioId: session.user.id,
      usuarioNome: session.user.name ?? session.user.email ?? '',
    },
  })
  return NextResponse.json(log, { status: 201 })
}
