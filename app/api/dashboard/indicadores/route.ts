export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dias = parseInt(request.nextUrl.searchParams.get('dias') ?? '30')
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - dias)

  const isAdmin = session.user.role === 'ADMIN'
  const usuarioId = session.user.id

  const whereBase = isAdmin ? {} : { usuarioId }
  const wherePaciente = isAdmin ? {} : { paciente: { usuarioId } }

  const [
    totalPacientes,
    totalPacientesAnterior,
    atendimentosMes,
    atendimentosPorMes,
    prmsAbertos,
    intervencoesMes,
    distribuicaoRisco,
    topDoencas,
    topMedicamentos,
    totalPrms,
    prmsResolvidos,
    proximosRetornos,
  ] = await Promise.all([
    prisma.paciente.count({ where: { ...whereBase, ativo: true } }),
    prisma.paciente.count({
      where: { ...whereBase, ativo: true, criadoEm: { lt: dataInicio } },
    }),
    prisma.atendimento.count({
      where: { ...wherePaciente, dataAtendimento: { gte: dataInicio } },
    }),
    // Atendimentos por mês (últimos 6 meses)
    prisma.$queryRawUnsafe<Array<{ mes: string; total: bigint }>>(`
      SELECT TO_CHAR(DATE_TRUNC('month', "data_atendimento"), 'YYYY-MM') as mes, COUNT(*) as total
      FROM atendimentos a
      ${!isAdmin ? `JOIN pacientes p ON a.paciente_id = p.id WHERE p.usuario_id = '${usuarioId}'` : 'WHERE 1=1'}
      AND a.data_atendimento >= NOW() - INTERVAL '6 months'
      GROUP BY mes ORDER BY mes
    `),
    prisma.problemaMedicamento.count({
      where: { ...wherePaciente, status: 'IDENTIFICADO' },
    }),
    prisma.intervencao.count({
      where: { ...wherePaciente, criadoEm: { gte: dataInicio } },
    }),
    // Distribuição de risco
    prisma.$queryRawUnsafe<Array<{ nivel: string; total: bigint }>>(`
      SELECT DISTINCT ON (paciente_id) nivel_risco as nivel, COUNT(*) OVER (PARTITION BY nivel_risco) as total
      FROM estratificacoes_risco er
      ${!isAdmin ? `JOIN pacientes p ON er.paciente_id = p.id WHERE p.usuario_id = '${usuarioId}'` : 'WHERE 1=1'}
      ORDER BY paciente_id, calculado_em DESC
    `),
    // Top doenças
    prisma.$queryRawUnsafe<Array<{ doenca: string; total: bigint }>>(`
      SELECT doenca, COUNT(*) as total
      FROM historico_clinico hc
      ${!isAdmin ? `JOIN pacientes p ON hc.paciente_id = p.id WHERE p.usuario_id = '${usuarioId}' AND` : 'WHERE'} hc.status = 'ATIVA'
      GROUP BY doenca ORDER BY total DESC LIMIT 5
    `),
    // Top medicamentos
    prisma.$queryRawUnsafe<Array<{ nome: string; total: bigint }>>(`
      SELECT m.nome, COUNT(*) as total
      FROM medicamentos_em_uso meu
      JOIN medicamentos m ON meu.medicamento_id = m.id
      ${!isAdmin ? `JOIN pacientes p ON meu.paciente_id = p.id WHERE p.usuario_id = '${usuarioId}' AND` : 'WHERE'} meu.ativo = true
      GROUP BY m.nome ORDER BY total DESC LIMIT 5
    `),
    prisma.problemaMedicamento.count({ where: wherePaciente }),
    prisma.problemaMedicamento.count({
      where: { ...wherePaciente, status: 'RESOLVIDO' },
    }),
    // Próximos retornos (7 dias)
    prisma.planoAcompanhamento.findMany({
      where: {
        ...wherePaciente,
        proximoRetorno: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 86400000),
        },
      },
      include: { paciente: { select: { nome: true, sobrenome: true } } },
      orderBy: { proximoRetorno: 'asc' },
      take: 10,
    }),
  ])

  // Agrupar distribuição de risco
  const riscoMap: Record<string, number> = {}
  for (const r of distribuicaoRisco) {
    riscoMap[r.nivel] = (riscoMap[r.nivel] ?? 0) + 1
  }

  return NextResponse.json({
    totalPacientes,
    novosNoPeriodo: totalPacientes - totalPacientesAnterior,
    atendimentosMes,
    prmsAbertos,
    intervencoesMes,
    taxaResolucaoPrms: totalPrms > 0 ? Math.round((prmsResolvidos / totalPrms) * 100) : 0,
    atendimentosPorMes: atendimentosPorMes.map((r) => ({
      mes: r.mes,
      total: Number(r.total),
    })),
    distribuicaoRisco: Object.entries(riscoMap).map(([nivel, total]) => ({ nivel, total })),
    topDoencas: topDoencas.map((r) => ({ doenca: r.doenca, total: Number(r.total) })),
    topMedicamentos: topMedicamentos.map((r) => ({ nome: r.nome, total: Number(r.total) })),
    proximosRetornos: proximosRetornos.map((p) => ({
      id: p.id,
      pacienteNome: `${p.paciente.nome} ${p.paciente.sobrenome}`,
      data: p.proximoRetorno,
      tipo: p.tipoAtendimentoProgramado,
    })),
  })
}
