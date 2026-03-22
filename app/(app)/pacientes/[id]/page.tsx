import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { FichaPaciente } from '@/components/modules/pacientes/ficha-paciente'

interface Props {
  params: { id: string }
}

export default async function FichaPacientePage({ params }: Props) {
  const paciente = await prisma.paciente.findUnique({
    where: { id: params.id },
    include: {
      atendimentos: {
        orderBy: { createdAt: 'desc' },
        include: {
          dadosClinicos: true,
          exames: true,
          analise: true,
          prms: true,
          intervencoes: true,
          evolucaoClinica: true,
        },
      },
      medicamentos: { where: { ativo: true } },
      historicoClinicos: true,
      anexos: true,
    },
  })

  if (!paciente) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{paciente.nome}</h1>
          <p className="text-gray-500 text-sm">Ficha clínica completa</p>
        </div>
      </div>
      <FichaPaciente paciente={paciente} />
    </div>
  )
}
