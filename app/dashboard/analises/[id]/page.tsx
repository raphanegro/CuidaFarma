'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit2, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Paciente {
  id: string
  nome: string
  sobrenome: string
}

interface Medicamento {
  id: string
  nome: string
}

interface Intervencao {
  id: string
  tipo: string
  descricao: string
  status: string
  dataSugestao: string
}

interface Analise {
  id: string
  tipo: string
  descricao: string
  achados: string[]
  recomendacoes: string[]
  status: string
  data: string
  criadoEm: string
  atualizadoEm: string
  paciente: Paciente
  medicamento: Medicamento
  intervencoes: Intervencao[]
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  em_progresso: { bg: 'bg-blue-100', text: 'text-blue-800' },
  concluida: { bg: 'bg-green-100', text: 'text-green-800' },
  revisao: { bg: 'bg-purple-100', text: 'text-purple-800' },
}

export default function AnáliseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [analise, setAnalise] = useState<Analise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchAnalise()
  }, [id])

  const fetchAnalise = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(`/api/analises/${id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Análise não encontrada')
      }

      const data = await response.json()
      setAnalise(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar esta análise?')) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/analises/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao deletar análise')
      }

      router.push('/dashboard/analises')
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

  if (!analise) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/analises"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="card text-center py-12">
          <p className="text-gray-500">{error || 'Análise não encontrada'}</p>
        </div>
      </div>
    )
  }

  const statusColor = statusColors[analise.status] || statusColors.pendente

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/analises"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/analises/${id}/editar`}
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

      <div className="grid grid-cols-3 gap-6">
        <div className="card col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informações da Análise
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Tipo</p>
              <p className="text-lg font-medium text-gray-900">{analise.tipo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Descrição</p>
              <p className="text-gray-900 whitespace-pre-wrap">
                {analise.descricao}
              </p>
            </div>
            {analise.achados.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 font-semibold">Achados</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {analise.achados.map((achado, i) => (
                    <li key={i} className="text-gray-900">
                      {achado}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analise.recomendacoes.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 font-semibold">
                  Recomendações
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {analise.recomendacoes.map((rec, i) => (
                    <li key={i} className="text-gray-900">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informações Gerais
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${statusColor.bg} ${statusColor.text}`}
                >
                  {analise.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Paciente</p>
                <p className="font-medium text-gray-900 mt-1">
                  {analise.paciente.nome} {analise.paciente.sobrenome}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Medicamento</p>
                <p className="font-medium text-gray-900 mt-1">
                  {analise.medicamento.nome}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data da Análise</p>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(analise.data).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datas</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Criado em</p>
                <p className="text-gray-900">
                  {new Date(analise.criadoEm).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Atualizado em</p>
                <p className="text-gray-900">
                  {new Date(analise.atualizadoEm).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {analise.intervencoes.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Intervenções Relacionadas ({analise.intervencoes.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">
                    Descrição
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
                {analise.intervencoes.map((inter) => (
                  <tr key={inter.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{inter.tipo}</td>
                    <td className="px-4 py-2">{inter.descricao}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {inter.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(inter.dataSugestao).toLocaleDateString('pt-BR')}
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
