'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Loader2, Download, Filter } from 'lucide-react'

interface Relatorio {
  atendimentosPorFarmaceutico: { farmaceutico: string; total: number }[]
  prmsPorCategoria: { categoria: string; total: number }[]
  intervencoesPorTipo: { tipo: string; total: number }[]
  taxaResolucao: number
  farmaceuticos: { id: string; nome: string; sobrenome: string }[]
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AdminRelatoriosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dados, setDados] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(true)
  const [dias, setDias] = useState(30)
  const [farmaceuticoId, setFarmaceuticoId] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (session?.user?.role !== 'ADMIN') {
      router.replace('/dashboard')
      return
    }
    setLoading(true)
    const q = new URLSearchParams({ dias: String(dias) })
    if (farmaceuticoId) q.set('farmaceuticoId', farmaceuticoId)
    fetch(`/api/admin/relatorios?${q}`)
      .then((r) => r.json())
      .then(setDados)
      .finally(() => setLoading(false))
  }, [session, status, dias, farmaceuticoId])

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatorios Administrativos</h1>
          <p className="text-sm text-gray-500 mt-1">Visao geral de desempenho e qualidade</p>
        </div>
        <a
          href="/api/relatorios/pacientes"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar CSV Pacientes
        </a>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          <span>Periodo</span>
        </div>
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
        {dados && dados.farmaceuticos.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Farmaceutico</label>
            <select
              value={farmaceuticoId}
              onChange={(e) => setFarmaceuticoId(e.target.value)}
              className="input text-sm"
            >
              <option value="">Todos</option>
              {dados.farmaceuticos.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} {f.sobrenome}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Taxa de resolucao KPI */}
      {dados && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-5">
            <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Taxa de Resolucao de PRMs</p>
            <p className="mt-2 text-4xl font-bold text-green-800">{dados.taxaResolucao}%</p>
            <p className="text-xs text-green-600 mt-1">dos problemas foram resolvidos</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Farmaceuticos Ativos</p>
            <p className="mt-2 text-4xl font-bold text-blue-800">{dados.farmaceuticos.length}</p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-5">
            <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Tipos de Intervencao</p>
            <p className="mt-2 text-4xl font-bold text-purple-800">{dados.intervencoesPorTipo.length}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {dados && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Atendimentos por farmaceutico */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Atendimentos por Farmaceutico</h2>
            {dados.atendimentosPorFarmaceutico.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dados.atendimentosPorFarmaceutico} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="farmaceutico"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={120}
                    tickFormatter={(v) => v.split(' ')[0]}
                  />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                Sem atendimentos no periodo
              </div>
            )}
          </div>

          {/* PRMs por categoria */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">PRMs por Categoria</h2>
            {dados.prmsPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={dados.prmsPorCategoria}
                    dataKey="total"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {dados.prmsPorCategoria.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} formatter={(v) => <span className="text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                Sem PRMs registrados
              </div>
            )}
          </div>

          {/* Intervencoes por tipo */}
          <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Intervencoes por Tipo</h2>
            {dados.intervencoesPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dados.intervencoesPorTipo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                Sem intervencoes no periodo
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
