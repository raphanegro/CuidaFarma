import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { AtendimentoForm } from '@/components/modules/atendimentos/atendimento-form'

interface Props {
  params: { id: string }
}

export default async function NovoAtendimentoPage({ params }: Props) {
  const paciente = await prisma.paciente.findUnique({
    where: { id: params.id },
    include: { medicamentos: { where: { ativo: true } } },
  })

  if (!paciente) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Atendimento</h1>
        <p className="text-gray-500 text-sm">Paciente: {paciente.nome}</p>
      </div>
      <AtendimentoForm paciente={paciente} />
    </div>
  )
}
