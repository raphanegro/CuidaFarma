'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Analise {
  id: string
  tipo: string
  descricao: string
  achados: string[]
  recomendacoes: string[]
  status: string
  pacienteId: string
  medicamentoId: string
}

export default function EditarAnalisePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<Partial<Analise>>({
    tipo: '',
    descricao: '',
    achados: [],
    recomendacoes: [],
    status: 'pendente',
  })
  const [displayAchados, setDisplayAchados] = useState('')
  const [displayRecomendacoes, setDisplayRecomendacoes] = useState('')

  useEffect(() => {
    fetchAnalise()
  }, [id])

  const fetchAnalise = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analises/${id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Análise não encontrada')
      }

      const data = await response.json()
      setFormData(data)
      setDisplayAchados((data.achados || []).join('\n'))
      setDisplayRecomendacoes((data.recomendacoes || []).join('\n'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar análise')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const data = {
        tipo: formData.tipo,
        descricao: formData.descricao,
        achados: displayAchados
          .split('\n')
          .map((a) => a.trim())
          .filter(Boolean),
        recomendacoes: displayRecomendacoes
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
        status: formData.status,
      }

      const response = await fetch(`/api/analises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao atualizar análise')
        return
      }

      router.push(`/dashboard/analises/${id}`)
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/analises/${id}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Editar Análise</h1>
        <p className="text-gray-600 mt-2">Atualize as informações da análise</p>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Detalhes da Análise
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">Tipo de Análise *</label>
                <input
                  type="text"
                  name="tipo"
                  value={formData.tipo || ''}
                  onChange={handleChange}
                  required
                  className="input-base"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="label-base">Status</label>
                <select
                  name="status"
                  value={formData.status || 'pendente'}
                  onChange={handleChange}
                  className="input-base"
                  disabled={saving}
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_progresso">Em Progresso</option>
                  <option value="concluida">Concluída</option>
                  <option value="revisao">Em Revisão</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-base">Descrição da Análise *</label>
              <textarea
                name="descricao"
                value={formData.descricao || ''}
                onChange={handleChange}
                required
                className="input-base"
                rows={4}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label-base">Achados (um por linha)</label>
              <textarea
                value={displayAchados}
                onChange={(e) => setDisplayAchados(e.target.value)}
                className="input-base"
                rows={3}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label-base">Recomendações (uma por linha)</label>
              <textarea
                value={displayRecomendacoes}
                onChange={(e) => setDisplayRecomendacoes(e.target.value)}
                className="input-base"
                rows={3}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Análise'
            )}
          </button>
          <Link href={`/dashboard/analises/${id}`} className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
