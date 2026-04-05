import { prisma } from '@/lib/prisma'

export async function gerarAlertasDeterministicos(pacienteId: string) {
  const [medicamentos, exames] = await Promise.all([
    prisma.medicamentoEmUso.findMany({
      where: { pacienteId, status: 'EM_USO' },
      include: { medicamento: true },
    }),
    prisma.resultadoExame.findMany({
      where: { pacienteId },
      orderBy: { dataColeta: 'desc' },
      take: 20,
    }),
  ])

  const alertas: Array<{
    tipo: string
    severidade: string
    descricao: string
    medicamentosEnvolvidos?: string
    sugestaoAcao?: string
  }> = []

  // Polifarmácia
  if (medicamentos.length >= 5) {
    const nomes = medicamentos.map((m) => m.medicamento?.nome ?? m.nomeCustom ?? 'Medicamento').join(', ')
    alertas.push({
      tipo: 'POLIFARMACIA',
      severidade: medicamentos.length >= 10 ? 'CRITICO' : 'ATENCAO',
      descricao: `Paciente em uso de ${medicamentos.length} medicamentos simultâneos (polifarmácia${medicamentos.length >= 10 ? ' grave' : ''}).`,
      medicamentosEnvolvidos: nomes,
      sugestaoAcao: 'Revisar necessidade de todos os medicamentos. Considerar reconciliação medicamentosa.',
    })
  }

  // Exames fora da faixa
  for (const e of exames) {
    if (e.refMin == null && e.refMax == null) continue
    const valor = Number(e.valor)
    const min = e.refMin != null ? Number(e.refMin) : null
    const max = e.refMax != null ? Number(e.refMax) : null
    const foraFaixa = (min != null && valor < min) || (max != null && valor > max)
    if (!foraFaixa) continue
    const alto = max != null && valor > max
    alertas.push({
      tipo: 'EXAME_FORA_FAIXA',
      severidade: 'ATENCAO',
      descricao: `${e.tipo}: ${valor} ${e.unidade} — fora da faixa (${min ?? '?'}–${max ?? '?'} ${e.unidade}).`,
      sugestaoAcao: alto ? `Valor acima do limite. Avaliar ${e.tipo}.` : `Valor abaixo do limite. Avaliar ${e.tipo}.`,
    })
  }

  // Atualiza alertas determinísticos (não remove alertas de interação gerados por IA)
  await prisma.alertaClinico.deleteMany({
    where: { pacienteId, estado: 'ATIVO', tipo: { in: ['POLIFARMACIA', 'EXAME_FORA_FAIXA'] } },
  })

  if (alertas.length > 0) {
    await prisma.alertaClinico.createMany({
      data: alertas.map((a) => ({ ...a, pacienteId })),
    })
  }
}
