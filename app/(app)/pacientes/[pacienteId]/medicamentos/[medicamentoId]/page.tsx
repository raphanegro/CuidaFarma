import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { EditarMedicamento } from '@/components/modules/medicamentos/editar-medicamento'

interface Props {
  params: { pacienteId: string; medicamentoId: string }
}

export default async function EditarMedicamentoPage({ params }: Props) {
  const medicamento = await prisma.medicamentoUso.findUnique({
    where: { id: params.medicamentoId },
    include: { paciente: true },
  })

  if (!medicamento || medicamento.pacienteId !== params.pacienteId) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Medicamento</h1>
        <p className="text-gray-500 text-sm">Paciente: {medicamento.paciente.nome}</p>
      </div>
      <EditarMedicamento medicamento={medicamento} pacienteId={params.pacienteId} />
    </div>
  )
}
