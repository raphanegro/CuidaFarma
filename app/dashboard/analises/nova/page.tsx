'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
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

export default function NovaAnalisePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [formData, setFormData] = useState({
    pacienteId: '',
    medicamentoId: '',
    tipo: '',
    descricao: '',
    achados: '',
    recomendacoes: '',
    status: 'pendente',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      const [pacientesRes, medicamentosRes] = await Promise.all([
        fetch('/api/pacientes?limit=1000'),
        fetch('/api/medicamentos?limit=1000'),
      ])

      if (!pacientesRes.ok || !medicamentosRes.ok) {
        throw new Error('Erro ao carregar dados')
      }

      const pacientesData = await pacientesRes.json()
      const medicamentosData = await medicamentosRes.json()

      setPacientes(pacientesData.pacientes)
      setMedicamentos(medicamentosData.medicamentos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoadingData(false)
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

  const handleArrayChange = (
    field: 'achados' | 'recomendacoes',
    value: string
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        ...formData,
        achados: formData.achados
          .split('\n')
          .map((a) => a.trim())
          .filter(Boolean),
        recomendacoes: formData.recomendacoes
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
      }

      const response = await fetch('/api/analises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao criar análise')
        return
      }

      router.push('/dashboard/analises')
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nova Análise</h1>
        <p className="text-gray-600 mt-2">
          Crie uma nova análise farmacoterapêutica
        </p>
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
            Informações Básicas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Paciente *</label>
              <select
                name="pacienteId"
                value={formData.pacienteId}
                onChange={handleChange}
                required
                className="input-base"
                disabled={loading}
              >
                <option value="">Selecione um paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.sobrenome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Medicamento *</label>
              <select
                name="medicamentoId"
                value={formData.medicamentoId}
                onChange={handleChange}
                required
                className="input-base"
                disabled={loading}
              >
                <option value="">Selecione um medicamento...</option>
                {medicamentos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  className="input-base"
                  placeholder="Ex: Avaliação de Interações"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label-base">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-base"
                  disabled={loading}
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
                value={formData.descricao}
                onChange={handleChange}
                required
                className="input-base"
                rows={4}
                placeholder="Descreva os detalhes da análise..."
                disabled={loading}
              />
            </div>

            <div>
              <label className="label-base">Achados (um por linha)</label>
              <textarea
                name="achados"
                value={formData.achados}
                onChange={(e) => handleArrayChange('achados', e.target.value)}
                className="input-base"
                rows={3}
                placeholder="Achado 1&#10;Achado 2&#10;..."
                disabled={loading}
              />
            </div>

            <div>
              <label className="label-base">Recomendações (uma por linha)</label>
              <textarea
                name="recomendacoes"
                value={formData.recomendacoes}
                onChange={(e) =>
                  handleArrayChange('recomendacoes', e.target.value)
                }
                className="input-base"
                rows={3}
                placeholder="Recomendação 1&#10;Recomendação 2&#10;..."
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Análise'
            )}
          </button>
          <Link href="/dashboard/analises" className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
