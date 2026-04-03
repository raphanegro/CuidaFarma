'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit2, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Analise {
  id: string
  data: string
  tipo: string
  status: string
  paciente: {
    id: string
    nome: string
    sobrenome: string
  }
}

interface Medicamento {
  id: string
  nome: string
  principioAtivo: string
  dosagem: string
  forma: string
  fabricante?: string
  codigoATC?: string
  criadoEm: string
  atualizadoEm: string
  analises: Analise[]
}

export default function MedicamentoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [medicamento, setMedicamento] = useState<Medicamento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMedicamento()
  }, [id])

  const fetchMedicamento = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(`/api/medicamentos/${id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Medicamento não encontrado')
      }

      const data = await response.json()
      setMedicamento(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este medicamento?')) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/medicamentos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao deletar medicamento')
      }

      router.push('/dashboard/medicamentos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!medicamento) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/medicamentos"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="card text-center py-12">
          <p className="text-gray-500">{error || 'Medicamento não encontrado'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/medicamentos"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/medicamentos/${id}/editar`}
            className="btn-primary flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-secondary flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Deletar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informações Gerais
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Nome</p>
              <p className="text-lg font-medium text-gray-900">{medicamento.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Princípio Ativo</p>
              <p className="text-lg font-medium text-gray-900">
                {medicamento.principioAtivo}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dosagem</p>
              <p className="text-lg font-medium text-gray-900">{medicamento.dosagem}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Forma Farmacêutica</p>
              <p className="text-lg font-medium text-gray-900">{medicamento.forma}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Detalhes Adicionais
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Fabricante</p>
              <p className="text-lg font-medium text-gray-900">
                {medicamento.fabricante || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Código ATC</p>
              <p className="text-lg font-medium text-gray-900">
                {medicamento.codigoATC || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Criado em</p>
              <p className="text-sm text-gray-900">
                {new Date(medicamento.criadoEm).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Atualizado em</p>
              <p className="text-sm text-gray-900">
                {new Date(medicamento.atualizadoEm).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {medicamento.analises.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Análises Associadas ({medicamento.analises.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">
                    Paciente
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {medicamento.analises.map((analise) => (
                  <tr key={analise.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {analise.paciente.nome} {analise.paciente.sobrenome}
                    </td>
                    <td className="px-4 py-2">{analise.tipo}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {analise.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(analise.data).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
