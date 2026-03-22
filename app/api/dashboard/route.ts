import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [totalPacientes, atendimentosMes, totalPRMs, intervencoes] = await Promise.all([
    prisma.paciente.count(),
    prisma.atendimento.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.pRM.count({ where: { resolvido: false } }),
    prisma.intervencaoFarmaceutica.count(),
  ])

  return NextResponse.json({
    totalPacientes,
    atendimentosMes,
    totalPRMs,
    intervencoes,
    alertas: [],
  })
}
