'use client'

import { useSession } from 'next-auth/react'
import { Users, Activity, AlertTriangle, Calendar, TrendingUp, Download, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import Link from 'next/link'

interface Indicadores {
  totalPacientes: number
  atendimentosMes: number
  prmsAbertos: number
  intervencoesMes: number
  taxaResolucaoPrms: number
  atendimentosPorMes: { mes: string; total: number }[]
  distribuicaoRisco: { risco: string; total: number }[]
  topDoencas: { doenca: string; total: number }[]
  topMedicamentos: { medicamento: string; total: number }[]
  proximosRetornos: { nome: string; sobrenome: string; id: string; retorno: string }[]
}

const RISCO_COLORS: Record<string, string> = {
  BAIXO: '#22c55e',
  MODERADO: '#f59e0b',
  ALTO: '#ef4444',
  CRITICO: '#7c3aed',
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [dias, setDias] = useState(30)
  const [dados, setDados] = useState<Indicadores | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    setLoading(true)
    setErro(false)
    fetch(`/api/dashboard/indicadores?dias=${dias}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDados)
      .catch(() => setErro(true))
      .finally(() => setLoading(false))
  }, [dias])

  const kpis = dados
    ? [
        {
          label: 'Pacientes Ativos',
          value: dados.totalPacientes,
          icon: Users,
          color: 'bg-blue-50 text-blue-600',
          border: 'border-blue-200',
        },
        {
          label: 'Atendimentos (periodo)',
          value: dados.atendimentosMes,
          icon: Activity,
          color: 'bg-green-50 text-green-600',
          border: 'border-green-200',
        },
        {
          label: 'PRMs Abertos',
          value: dados.prmsAbertos,
          icon: AlertTriangle,
          color: 'bg-orange-50 text-orange-600',
          border: 'border-orange-200',
        },
        {
          label: 'Intervencoes (periodo)',
          value: dados.intervencoesMes,
          icon: TrendingUp,
          color: 'bg-purple-50 text-purple-600',
          border: 'border-purple-200',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ola, {session?.user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">Painel de Acompanhamento Farmaceutico</p>
        </div>
        <div className="flex gap-2">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dias === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Nao foi possivel carregar os indicadores. Tente recarregar a pagina.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-5 animate-pulse bg-gray-50">
                <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
            ))
          : kpis.map((k) => {
              const Icon = k.icon
              return (
                <div key={k.label} className={`rounded-lg border ${k.border} p-5 ${k.color.split(' ')[0]}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{k.label}</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{k.value}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${k.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              )
            })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Atendimentos por Mes</h2>
          {loading ? (
            <div className="h-48 bg-gray-50 animate-pulse rounded" />
          ) : dados && dados.atendimentosPorMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dados.atendimentosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              Sem dados no periodo
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Distribuicao de Risco</h2>
          {loading ? (
            <div className="h-48 bg-gray-50 animate-pulse rounded" />
          ) : dados && dados.distribuicaoRisco.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dados.distribuicaoRisco}
                  dataKey="total"
                  nameKey="risco"
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    `${name} ${((percent as number) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {dados.distribuicaoRisco.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={RISCO_COLORS[entry.risco] ?? '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              Sem dados
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Doencas */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top 5 Doencas</h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-5 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : dados && dados.topDoencas.length > 0 ? (
            <ul className="space-y-3">
              {dados.topDoencas.map((item, i) => {
                const max = dados.topDoencas[0].total
                return (
                  <li key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 truncate max-w-[70%]">{item.doenca}</span>
                      <span className="text-gray-500 font-medium">{item.total}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div
                        className="h-1.5 bg-blue-400 rounded-full"
                        style={{ width: `${(item.total / max) * 100}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Sem dados</p>
          )}
        </div>

        {/* Top Medicamentos */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top 5 Medicamentos</h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-5 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : dados && dados.topMedicamentos.length > 0 ? (
            <ul className="space-y-3">
              {dados.topMedicamentos.map((item, i) => {
                const max = dados.topMedicamentos[0].total
                return (
                  <li key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 truncate max-w-[70%]">{item.medicamento}</span>
                      <span className="text-gray-500 font-medium">{item.total}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div
                        className="h-1.5 bg-green-400 rounded-full"
                        style={{ width: `${(item.total / max) * 100}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Sem dados</p>
          )}
        </div>

        {/* Proximos Retornos + Acoes */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Proximos Retornos
            </h2>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />
                ))}
              </div>
            ) : dados && dados.proximosRetornos.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {dados.proximosRetornos.slice(0, 5).map((p) => (
                  <li key={p.id} className="py-2 flex justify-between items-center">
                    <Link
                      href={`/dashboard/pacientes/${p.id}`}
                      className="text-sm text-blue-600 hover:underline truncate max-w-[60%]"
                    >
                      {p.nome} {p.sobrenome}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {new Date(p.retorno).toLocaleDateString('pt-BR')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">Nenhum retorno agendado</p>
            )}
          </div>

          {/* Acoes Rapidas */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Acoes Rapidas</h2>
            <div className="space-y-2">
              <Link href="/dashboard/pacientes/novo" className="btn-primary block text-center text-sm py-2">
                + Novo Paciente
              </Link>
              <a
                href="/api/relatorios/pacientes"
                target="_blank"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </a>
              {session?.user?.role === 'ADMIN' && (
                <Link
                  href="/dashboard/admin/relatorios"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Relatorios Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
