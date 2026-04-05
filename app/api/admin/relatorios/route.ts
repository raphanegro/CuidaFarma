export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const dias = parseInt(request.nextUrl.searchParams.get('dias') ?? '30')
  const farmaceuticoId = request.nextUrl.searchParams.get('farmaceuticoId')
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - dias)

  const whereAtendimento: Record<string, unknown> = { dataAtendimento: { gte: dataInicio } }
  if (farmaceuticoId) whereAtendimento.usuarioId = farmaceuticoId

  const [
    atendimentosPorFarmaceutico,
    prmsPorCategoria,
    intervencoesPorTipo,
    farmaceuticos,
    taxaResolucaoAtual,
    taxaResolucaoAnterior,
  ] = await Promise.all([
    prisma.atendimento.groupBy({
      by: ['usuarioId'],
      where: whereAtendimento,
      _count: { id: true },
    }),
    prisma.problemaMedicamento.groupBy({
      by: ['categoria'],
      where: farmaceuticoId ? { paciente: { usuarioId: farmaceuticoId } } : {},
      _count: { id: true },
    }),
    prisma.intervencao.groupBy({
      by: ['tipo'],
      where: farmaceuticoId
        ? { paciente: { usuarioId: farmaceuticoId }, criadoEm: { gte: dataInicio } }
        : { criadoEm: { gte: dataInicio } },
      _count: { id: true },
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, sobrenome: true },
    }),
    prisma.problemaMedicamento.count({ where: { status: 'RESOLVIDO' } }),
    prisma.problemaMedicamento.count({}),
  ])

  const farmaceuticoMap = Object.fromEntries(
    farmaceuticos.map((f) => [f.id, `${f.nome} ${f.sobrenome}`])
  )

  return NextResponse.json({
    atendimentosPorFarmaceutico: atendimentosPorFarmaceutico.map((r) => ({
      farmaceutico: farmaceuticoMap[r.usuarioId] ?? r.usuarioId,
      total: r._count.id,
    })),
    prmsPorCategoria: prmsPorCategoria.map((r) => ({
      categoria: r.categoria,
      total: r._count.id,
    })),
    intervencoesPorTipo: intervencoesPorTipo.map((r) => ({
      tipo: r.tipo,
      total: r._count.id,
    })),
    taxaResolucao: taxaResolucaoAnterior > 0
      ? Math.round((taxaResolucaoAtual / taxaResolucaoAnterior) * 100)
      : 0,
    farmaceuticos,
  })
}
