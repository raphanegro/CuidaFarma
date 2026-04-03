'use client'

import { Plus, Search, Edit2, Trash2, Eye, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Analise {
  id: string
  tipo: string
  descricao: string
  status: string
  data: string
  paciente: {
    id: string
    nome: string
    sobrenome: string
  }
  medicamento: {
    id: string
    nome: string
  }
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  em_progresso: { bg: 'bg-blue-100', text: 'text-blue-800' },
  concluida: { bg: 'bg-green-100', text: 'text-green-800' },
  revisao: { bg: 'bg-purple-100', text: 'text-purple-800' },
}

export default function AnalisesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [analises, setAnalises] = useState<Analise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalises()
  }, [search, page])

  const fetchAnalises = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(
        `/api/analises?search=${search}&page=${page}&limit=10`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar análises')
      }

      setAnalises(data.analises)
      setTotal(data.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setAnalises([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta análise?')) return

    try {
      setDeleting(id)
      const response = await fetch(`/api/analises/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao deletar análise')
      }

      fetchAnalises()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Análises Farmacoterapêuticas</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/analises/nova-ia"
            className="btn-primary flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Sparkles className="h-4 w-4" />
            Com IA
          </Link>
          <Link
            href="/dashboard/analises/nova"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Manual
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por tipo ou descrição..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="input-base pl-10"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Carregando análises...</p>
        </div>
      ) : analises.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Nenhuma análise encontrada</p>
          <p className="text-sm text-gray-400 mb-4">
            {search ? 'Tente refinar sua busca' : 'Crie sua primeira análise'}
          </p>
          {!search && (
            <Link
              href="/dashboard/analises/nova"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Análise
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Medicamento
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {analises.map((analise) => {
                  const statusColor = statusColors[analise.status] || statusColors.pendente
                  return (
                    <tr
                      key={analise.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {analise.paciente.nome} {analise.paciente.sobrenome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {analise.medicamento.nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {analise.tipo}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}
                        >
                          {analise.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(analise.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(`/dashboard/analises/${analise.id}`)
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/dashboard/analises/${analise.id}/editar`}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(analise.id)}
                            disabled={deleting === analise.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {total > 10 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-600">
                Mostrando {analises.length} de {total} análises
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 10 >= total}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
