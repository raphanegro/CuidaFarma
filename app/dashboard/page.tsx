'use client'

import { useSession } from 'next-auth/react'
import { Users, Pill, FileText, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalPacientes: number
  totalMedicamentos: number
  totalAnalises: number
  intervencoesPendentes: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    totalMedicamentos: 0,
    totalAnalises: 0,
    intervencoesPendentes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          setStatsError(true)
        }
      } catch {
        setStatsError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Pacientes',
      value: stats.totalPacientes,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Medicamentos',
      value: stats.totalMedicamentos,
      icon: Pill,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Análises',
      value: stats.totalAnalises,
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Intervenções Pendentes',
      value: stats.intervencoesPendentes,
      icon: Activity,
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Olá, {session?.user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Bem-vindo ao painel de controle do CuidaFarma
        </p>
      </div>

      {statsError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Não foi possível carregar as estatísticas. Tente recarregar a página.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={`rounded-lg border border-gray-200 p-6 ${stat.bgColor}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {loading ? '-' : stat.value}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ações Rápidas
          </h2>
          <div className="space-y-2">
            <a
              href="/dashboard/pacientes/novo"
              className="btn-primary block text-center"
            >
              + Novo Paciente
            </a>
            <a
              href="/dashboard/analises/nova"
              className="btn-secondary block text-center"
            >
              + Nova Análise
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informações do Sistema
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <strong>Versão:</strong> 1.0.0
            </li>
            <li>
              <strong>Status:</strong>{' '}
              <span className="text-green-600 font-medium">Operacional</span>
            </li>
            <li>
              <strong>Seu Perfil:</strong>{' '}
              {session?.user?.role === 'ADMIN' ? 'Administrador' : 'Farmacêutico'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
