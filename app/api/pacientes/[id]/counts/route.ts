export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pacienteId = params.id

  const [
    exames,
    medicamentos,
    prms,
    intervencoes,
    anexos,
    alertas,
    cartas,
    tarefas,
  ] = await Promise.all([
    prisma.resultadoExame.count({ where: { pacienteId } }),
    prisma.medicamentoEmUso.count({ where: { pacienteId, status: 'EM_USO' } }),
    prisma.problemaMedicamento.count({ where: { pacienteId, status: { not: 'RESOLVIDO' } } }),
    prisma.intervencao.count({ where: { pacienteId, status: { not: 'IMPLEMENTED' } } }),
    prisma.anexo.count({ where: { pacienteId } }),
    prisma.alertaClinico.count({ where: { pacienteId, estado: 'ATIVO' } }),
    prisma.cartaPrescritor.count({ where: { pacienteId } }),
    prisma.tarefaPaciente.count({ where: { pacienteId, concluida: false } }),
  ])

  return NextResponse.json({ exames, medicamentos, prms, intervencoes, anexos, alertas, cartas, tarefas })
}
