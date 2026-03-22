import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PacienteForm } from '@/components/modules/pacientes/paciente-form'

export default async function EditarPacientePage({ params }: { params: { id: string } }) {
  const paciente = await prisma.paciente.findUnique({ where: { id: params.id } })
  if (!paciente) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Paciente</h1>
        <p className="text-gray-500 text-sm">{paciente.nome}</p>
      </div>
      <PacienteForm paciente={paciente} />
    </div>
  )
}
