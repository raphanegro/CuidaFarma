import { PacienteForm } from '@/components/modules/pacientes/paciente-form'

export default function NovoPacientePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Paciente</h1>
        <p className="text-gray-500 text-sm">Cadastre as informações do paciente</p>
      </div>
      <PacienteForm />
    </div>
  )
}
