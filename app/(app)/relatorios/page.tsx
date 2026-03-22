import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions)
  const perfil = (session?.user as any)?.perfil
  if (perfil !== 'ADMINISTRADOR') redirect('/dashboard')

  const [totalPacientes, totalAtendimentos, totalPRMs, totalIntervencoes] = await Promise.all([
    prisma.paciente.count(),
    prisma.atendimento.count(),
    prisma.pRM.count(),
    prisma.intervencaoFarmaceutica.count(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios de Produção</h1>
        <p className="text-gray-500 text-sm">Indicadores e métricas do serviço</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Pacientes', value: totalPacientes },
          { label: 'Total de Atendimentos', value: totalAtendimentos },
          { label: 'PRMs Registrados', value: totalPRMs },
          { label: 'Intervenções', value: totalIntervencoes },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
