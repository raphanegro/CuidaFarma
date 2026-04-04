import { prisma } from '@/lib/prisma'
import { NivelRisco } from '@prisma/client'

export interface RiscoResult {
  pontuacao: number
  nivel: NivelRisco
  criterios: { nome: string; ativo: boolean; descricao: string }[]
}

export async function calcularRisco(pacienteId: string): Promise<RiscoResult> {
  const [paciente, medicamentos, historico, prms, ultimaAdesao] = await Promise.all([
    prisma.paciente.findUnique({ where: { id: pacienteId }, select: { dataNascimento: true } }),
    prisma.medicamentoEmUso.count({ where: { pacienteId, status: 'EM_USO' } }),
    prisma.historicoClinico.count({ where: { pacienteId, status: 'ATIVA' } }),
    prisma.problemaMedicamento.count({ where: { pacienteId, gravidade: 'GRAVE', status: { not: 'RESOLVIDO' } } }),
    prisma.avaliacaoAdesao.findFirst({
      where: { pacienteId },
      orderBy: { criadoEm: 'desc' },
      select: { taxaAdesao: true, classificacao: true },
    }),
  ])

  const criterios: { nome: string; ativo: boolean; descricao: string }[] = []
  let pontuacao = 0

  // Polifarmácia
  const polifarmaciaModerado = medicamentos >= 5 && medicamentos < 10
  const polifarmaciaAlto = medicamentos >= 10
  criterios.push({
    nome: 'Polifarmácia',
    ativo: medicamentos >= 5,
    descricao: `${medicamentos} medicamentos em uso${polifarmaciaAlto ? ' (≥10 — risco alto)' : polifarmaciaModerado ? ' (≥5 — risco moderado)' : ''}`,
  })
  if (polifarmaciaAlto) pontuacao += 2
  else if (polifarmaciaModerado) pontuacao += 1

  // Idade ≥65
  const idade = paciente?.dataNascimento
    ? new Date().getFullYear() - new Date(paciente.dataNascimento).getFullYear()
    : 0
  const idadeRisco = idade >= 65
  criterios.push({ nome: 'Idade ≥65 anos', ativo: idadeRisco, descricao: `${idade} anos` })
  if (idadeRisco) pontuacao += 1

  // Doenças crônicas
  const doencasModerado = historico >= 3 && historico < 5
  const doencasAlto = historico >= 5
  criterios.push({
    nome: 'Doenças crônicas',
    ativo: historico >= 3,
    descricao: `${historico} condições ativas${doencasAlto ? ' (≥5 — risco alto)' : doencasModerado ? ' (≥3 — risco moderado)' : ''}`,
  })
  if (doencasAlto) pontuacao += 2
  else if (doencasModerado) pontuacao += 1

  // PRM grave ativo
  criterios.push({
    nome: 'PRM com gravidade GRAVE',
    ativo: prms > 0,
    descricao: `${prms} PRM(s) grave(s) não resolvido(s)`,
  })
  if (prms > 0) pontuacao += 2

  // Baixa adesão
  const baixaAdesao = ultimaAdesao?.classificacao === 'BAIXA'
  criterios.push({
    nome: 'Baixa adesão',
    ativo: baixaAdesao,
    descricao: ultimaAdesao
      ? `Última taxa: ${Number(ultimaAdesao.taxaAdesao).toFixed(0)}% (${ultimaAdesao.classificacao})`
      : 'Sem avaliação de adesão registrada',
  })
  if (baixaAdesao) pontuacao += 1

  // Determinar nível
  let nivel: NivelRisco = 'BAIXO'
  if (prms > 0 || pontuacao >= 4) nivel = 'ALTO'
  else if (pontuacao >= 2) nivel = 'MODERADO'

  return { pontuacao, nivel, criterios }
}
