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

  // Colunas são camelCase no banco (sem @map nos fields do schema)
  // Usar $queryRaw com template literals (parametrizado — sem SQL injection)
  const [atendimentosPorMesRaw, distribuicaoRiscoRaw, topDoencasRaw, topMedicamentosRaw] =
    await Promise.all([
      // Atendimentos por mês (últimos 6 meses)
      isAdmin
        ? prisma.$queryRaw<Array<{ mes: string; total: bigint }>>`
            SELECT TO_CHAR(DATE_TRUNC('month', "dataAtendimento"), 'YYYY-MM') as mes,
                   COUNT(*) as total
            FROM atendimentos
            WHERE "dataAtendimento" >= NOW() - INTERVAL '6 months'
            GROUP BY mes ORDER BY mes
          `
        : prisma.$queryRaw<Array<{ mes: string; total: bigint }>>`
            SELECT TO_CHAR(DATE_TRUNC('month', a."dataAtendimento"), 'YYYY-MM') as mes,
                   COUNT(*) as total
            FROM atendimentos a
            JOIN pacientes p ON a."pacienteId" = p.id
            WHERE p."usuarioId" = ${usuarioId}
              AND a."dataAtendimento" >= NOW() - INTERVAL '6 months'
            GROUP BY mes ORDER BY mes
          `,

      // Distribuição de risco — nível mais recente por paciente
      isAdmin
        ? prisma.$queryRaw<Array<{ risco: string; total: bigint }>>`
            SELECT "nivelRisco" as risco, COUNT(*) as total
            FROM (
              SELECT DISTINCT ON ("pacienteId") "nivelRisco"
              FROM estratificacoes_risco
              ORDER BY "pacienteId", "calculadoEm" DESC
            ) latest
            GROUP BY "nivelRisco"
            ORDER BY total DESC
          `
        : prisma.$queryRaw<Array<{ risco: string; total: bigint }>>`
            SELECT "nivelRisco" as risco, COUNT(*) as total
            FROM (
              SELECT DISTINCT ON (er."pacienteId") er."nivelRisco"
              FROM estratificacoes_risco er
              JOIN pacientes p ON er."pacienteId" = p.id
              WHERE p."usuarioId" = ${usuarioId}
              ORDER BY er."pacienteId", er."calculadoEm" DESC
            ) latest
            GROUP BY "nivelRisco"
            ORDER BY total DESC
          `,

      // Top 5 doenças ativas
      isAdmin
        ? prisma.$queryRaw<Array<{ doenca: string; total: bigint }>>`
            SELECT doenca, COUNT(*) as total
            FROM historico_clinico
            WHERE status = 'ATIVA'
            GROUP BY doenca ORDER BY total DESC LIMIT 5
          `
        : prisma.$queryRaw<Array<{ doenca: string; total: bigint }>>`
            SELECT hc.doenca, COUNT(*) as total
            FROM historico_clinico hc
            JOIN pacientes p ON hc."pacienteId" = p.id
            WHERE p."usuarioId" = ${usuarioId}
              AND hc.status = 'ATIVA'
            GROUP BY hc.doenca ORDER BY total DESC LIMIT 5
          `,

      // Top 5 medicamentos em uso (status = 'EM_USO')
      isAdmin
        ? prisma.$queryRaw<Array<{ nome: string; total: bigint }>>`
            SELECT m.nome, COUNT(*) as total
            FROM medicamentos_em_uso meu
            JOIN medicamentos m ON meu."medicamentoId" = m.id
            WHERE meu.status = 'EM_USO'
            GROUP BY m.nome ORDER BY total DESC LIMIT 5
          `
        : prisma.$queryRaw<Array<{ nome: string; total: bigint }>>`
            SELECT m.nome, COUNT(*) as total
            FROM medicamentos_em_uso meu
            JOIN medicamentos m ON meu."medicamentoId" = m.id
            JOIN pacientes p ON meu."pacienteId" = p.id
            WHERE p."usuarioId" = ${usuarioId}
              AND meu.status = 'EM_USO'
            GROUP BY m.nome ORDER BY total DESC LIMIT 5
          `,
    ])

  const [
    totalPacientes,
    totalPacientesAnterior,
    atendimentosMes,
    prmsAbertos,
    intervencoesMes,
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
    prisma.problemaMedicamento.count({
      where: { ...wherePaciente, status: 'IDENTIFICADO' },
    }),
    prisma.intervencao.count({
      where: { ...wherePaciente, criadoEm: { gte: dataInicio } },
    }),
    prisma.problemaMedicamento.count({ where: wherePaciente }),
    prisma.problemaMedicamento.count({
      where: { ...wherePaciente, status: 'RESOLVIDO' },
    }),
    prisma.planoAcompanhamento.findMany({
      where: {
        ...wherePaciente,
        proximoRetorno: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 86400000),
        },
      },
      include: { paciente: { select: { id: true, nome: true, sobrenome: true } } },
      orderBy: { proximoRetorno: 'asc' },
      take: 10,
    }),
  ])

  return NextResponse.json({
    totalPacientes,
    novosNoPeriodo: totalPacientes - totalPacientesAnterior,
    atendimentosMes,
    prmsAbertos,
    intervencoesMes,
    taxaResolucaoPrms: totalPrms > 0 ? Math.round((prmsResolvidos / totalPrms) * 100) : 0,
    atendimentosPorMes: atendimentosPorMesRaw.map((r) => ({
      mes: r.mes,
      total: Number(r.total),
    })),
    distribuicaoRisco: distribuicaoRiscoRaw.map((r) => ({
      risco: r.risco,
      total: Number(r.total),
    })),
    topDoencas: topDoencasRaw.map((r) => ({ doenca: r.doenca, total: Number(r.total) })),
    topMedicamentos: topMedicamentosRaw.map((r) => ({ nome: r.nome, total: Number(r.total) })),
    proximosRetornos: proximosRetornos.map((p) => ({
      id: p.paciente.id,
      nome: p.paciente.nome,
      sobrenome: p.paciente.sobrenome,
      retorno: p.proximoRetorno,
    })),
  })
}
