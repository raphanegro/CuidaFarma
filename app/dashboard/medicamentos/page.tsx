'use client'

import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Medicamento {
  id: string
  nome: string
  principioAtivo: string
  dosagem: string
  forma: string
  fabricante?: string
  codigoATC?: string
  criadoEm: string
}

export default function MedicamentosPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchMedicamentos()
  }, [search, page])

  const fetchMedicamentos = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(
        `/api/medicamentos?search=${search}&page=${page}&limit=10`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar medicamentos')
      }

      setMedicamentos(data.medicamentos)
      setTotal(data.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setMedicamentos([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este medicamento?')) return

    try {
      setDeleting(id)
      const response = await fetch(`/api/medicamentos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao deletar medicamento')
      }

      fetchMedicamentos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Medicamentos</h1>
        <Link
          href="/dashboard/medicamentos/novo"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Medicamento
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, princípio ativo ou código ATC..."
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
          <p className="text-gray-500">Carregando medicamentos...</p>
        </div>
      ) : medicamentos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Nenhum medicamento encontrado</p>
          <p className="text-sm text-gray-400 mb-4">
            {search ? 'Tente refinar sua busca' : 'Crie seu primeiro medicamento'}
          </p>
          {!search && (
            <Link
              href="/dashboard/medicamentos/novo"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Medicamento
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
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Princípio Ativo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Dosagem
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Forma
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Fabricante
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {medicamentos.map((med) => (
                  <tr
                    key={med.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {med.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {med.principioAtivo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {med.dosagem}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {med.forma}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {med.fabricante || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/medicamentos/${med.id}`)
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/dashboard/medicamentos/${med.id}/editar`}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(med.id)}
                          disabled={deleting === med.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 10 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-600">
                Mostrando {medicamentos.length} de {total} medicamentos
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
