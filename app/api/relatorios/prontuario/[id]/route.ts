export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const paciente = await prisma.paciente.findUnique({
    where: { id: params.id },
    include: {
      atendimentos: {
        orderBy: { dataAtendimento: 'desc' },
        include: { dadosClinicos: true, problemas: true },
      },
      historicoClinico: true,
      medicamentosEmUso: { where: { status: 'EM_USO' }, include: { medicamento: true } },
      problemas: { include: { intervencoes: true } },
      resultadosExame: { orderBy: { dataColeta: 'desc' }, take: 20 },
      analises: { orderBy: { criadoEm: 'desc' }, take: 5 },
    },
  })

  if (!paciente) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  if (paciente.usuarioId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(paciente)
}
