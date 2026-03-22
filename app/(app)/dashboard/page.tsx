import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardStats } from '@/components/modules/dashboard/dashboard-stats'
import { AlertasList } from '@/components/modules/dashboard/alertas-list'
import { PacientesRecentes } from '@/components/modules/dashboard/pacientes-recentes'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id

  const [totalPacientes, atendimentosMes, totalPRMs, intervencoes] = await Promise.all([
    prisma.paciente.count(),
    prisma.atendimento.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.pRM.count({ where: { resolvido: false } }),
    prisma.intervencaoFarmaceutica.count(),
  ])

  const pacientesRecentes = await prisma.paciente.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      atendimentos: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Visão geral do serviço farmacêutico</p>
      </div>

      <DashboardStats
        totalPacientes={totalPacientes}
        atendimentosMes={atendimentosMes}
        totalPRMs={totalPRMs}
        intervencoes={intervencoes}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PacientesRecentes pacientes={pacientesRecentes} />
        <AlertasList />
      </div>
    </div>
  )
}
