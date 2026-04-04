export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calcularRisco } from '@/lib/risk-calculator'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('pacienteId')
  if (!pacienteId) return NextResponse.json({ error: 'pacienteId obrigatório' }, { status: 400 })

  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, usuarioId: session.user.id } })
  if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

  const historico = await prisma.estratificacaoRisco.findMany({
    where: { pacienteId },
    orderBy: { calculadoEm: 'desc' },
  })

  return NextResponse.json(historico)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { pacienteId, ajusteManual, nivelRiscoManual, justificativa } = body

  if (!pacienteId) return NextResponse.json({ error: 'pacienteId obrigatório' }, { status: 400 })

  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, usuarioId: session.user.id } })
  if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

  const { pontuacao, nivel } = await calcularRisco(pacienteId)

  const estratificacao = await prisma.estratificacaoRisco.create({
    data: {
      pacienteId,
      calculadoPor: session.user.id,
      pontuacaoAuto: pontuacao,
      nivelRisco: ajusteManual && nivelRiscoManual ? nivelRiscoManual : nivel,
      ajusteManual: !!ajusteManual,
      justificativa: justificativa || null,
    },
  })

  return NextResponse.json(estratificacao, { status: 201 })
}
