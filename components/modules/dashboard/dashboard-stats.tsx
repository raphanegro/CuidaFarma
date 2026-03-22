import { Users, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

interface Props {
  totalPacientes: number
  atendimentosMes: number
  totalPRMs: number
  intervencoes: number
}

export function DashboardStats({ totalPacientes, atendimentosMes, totalPRMs, intervencoes }: Props) {
  const stats = [
    { label: 'Total de Pacientes', value: totalPacientes, icon: Users, color: 'blue' },
    { label: 'Atendimentos no Mês', value: atendimentosMes, icon: Calendar, color: 'green' },
    { label: 'PRMs Ativos', value: totalPRMs, icon: AlertTriangle, color: 'amber' },
    { label: 'Intervenções', value: intervencoes, icon: CheckCircle, color: 'purple' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <stat.icon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
