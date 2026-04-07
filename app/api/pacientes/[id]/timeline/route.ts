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
    atendimentos,
    exames,
    medicamentos,
    prms,
    intervencoes,
    alertas,
    estratificacoes,
    evolucoes,
  ] = await Promise.all([
    prisma.atendimento.findMany({
      where: { pacienteId },
      select: { id: true, tipo: true, dataAtendimento: true, status: true, motivoConsulta: true },
      orderBy: { dataAtendimento: 'desc' },
    }),
    prisma.resultadoExame.findMany({
      where: { pacienteId },
      select: { id: true, tipo: true, tipoCustom: true, valor: true, unidade: true, dataColeta: true, refMin: true, refMax: true },
      orderBy: { dataColeta: 'desc' },
      take: 30,
    }),
    prisma.medicamentoEmUso.findMany({
      where: { pacienteId },
      select: { id: true, nomeCustom: true, status: true, dataInicio: true, medicamento: { select: { nome: true } } },
      orderBy: { dataInicio: 'desc' },
      take: 20,
    }),
    prisma.problemaMedicamento.findMany({
      where: { pacienteId },
      select: { id: true, categoria: true, descricao: true, gravidade: true, status: true, criadoEm: true },
      orderBy: { criadoEm: 'desc' },
      take: 20,
    }),
    prisma.intervencao.findMany({
      where: { pacienteId },
      select: { id: true, tipo: true, descricao: true, status: true, dataSugestao: true },
      orderBy: { dataSugestao: 'desc' },
      take: 20,
    }),
    prisma.alertaClinico.findMany({
      where: { pacienteId, severidade: { in: ['CRITICO', 'ATENCAO'] } },
      select: { id: true, tipo: true, severidade: true, descricao: true, criadoEm: true },
      orderBy: { criadoEm: 'desc' },
      take: 20,
    }),
    prisma.estratificacaoRisco.findMany({
      where: { pacienteId },
      select: { id: true, nivelRisco: true, calculadoEm: true, ajusteManual: true },
      orderBy: { calculadoEm: 'desc' },
      take: 10,
    }),
    prisma.evolucaoClinica.findMany({
      where: { pacienteId },
      select: { id: true, evolucaoTexto: true, adesao: true, criadoEm: true },
      orderBy: { criadoEm: 'desc' },
      take: 10,
    }),
  ])

  type Evento = { id: string; data: Date; tipo: string; categoria: string; descricao: string; detalhe?: string; cor: string }
  const eventos: Evento[] = []

  const TIPO_ATEND: Record<string, string> = {
    CONSULTORIO_FARMACEUTICO: 'Consultório', ORIENTACAO_FARMACIA: 'Orientação', ATIVIDADE_COLETIVA: 'At. Coletiva', VISITA_DOMICILIAR: 'Visita Domiciliar', OUTRO: 'Outro',
  }

  for (const a of atendimentos) {
    eventos.push({ id: a.id, data: a.dataAtendimento, tipo: 'atendimento', categoria: 'Atendimento', descricao: TIPO_ATEND[a.tipo] ?? a.tipo, detalhe: a.status, cor: 'blue' })
  }
  for (const e of exames) {
    const valor = Number(e.valor)
    const fora = (e.refMin != null && valor < Number(e.refMin)) || (e.refMax != null && valor > Number(e.refMax))
    eventos.push({ id: e.id, data: e.dataColeta, tipo: 'exame', categoria: 'Exame', descricao: `${e.tipoCustom ?? e.tipo}: ${valor} ${e.unidade}`, detalhe: fora ? '⚠ Fora da faixa' : undefined, cor: fora ? 'red' : 'gray' })
  }
  for (const m of medicamentos) {
    const nome = m.medicamento?.nome ?? m.nomeCustom ?? 'Medicamento'
    eventos.push({ id: m.id, data: m.dataInicio, tipo: 'medicamento', categoria: 'Medicamento', descricao: nome, detalhe: m.status, cor: m.status === 'EM_USO' ? 'green' : 'gray' })
  }
  for (const p of prms) {
    eventos.push({ id: p.id, data: p.criadoEm, tipo: 'prm', categoria: 'PRF', descricao: `${p.categoria}: ${p.descricao.slice(0, 60)}`, detalhe: p.gravidade, cor: p.gravidade === 'GRAVE' ? 'red' : 'orange' })
  }
  for (const i of intervencoes) {
    eventos.push({ id: i.id, data: i.dataSugestao, tipo: 'intervencao', categoria: 'Intervenção', descricao: i.descricao.slice(0, 80), detalhe: i.status, cor: 'purple' })
  }
  for (const a of alertas) {
    eventos.push({ id: a.id, data: a.criadoEm, tipo: 'alerta', categoria: 'Alerta', descricao: a.descricao.slice(0, 80), detalhe: a.severidade, cor: a.severidade === 'CRITICO' ? 'red' : 'yellow' })
  }
  for (const r of estratificacoes) {
    eventos.push({ id: r.id, data: r.calculadoEm, tipo: 'risco', categoria: 'Risco', descricao: `Risco ${r.nivelRisco}`, detalhe: r.ajusteManual ? 'Ajuste manual' : 'Calculado', cor: r.nivelRisco === 'ALTO' ? 'red' : r.nivelRisco === 'MODERADO' ? 'yellow' : 'green' })
  }
  for (const e of evolucoes) {
    eventos.push({ id: e.id, data: e.criadoEm, tipo: 'evolucao', categoria: 'Evolução', descricao: e.evolucaoTexto?.slice(0, 80) ?? 'Evolução registrada', detalhe: e.adesao ?? undefined, cor: 'teal' })
  }

  eventos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return NextResponse.json(eventos.map((e) => ({ ...e, data: e.data.toISOString() })))
}
