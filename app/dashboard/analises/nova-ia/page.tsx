'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Sparkles, ArrowLeft } from 'lucide-react'
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

export default function NovaAnáliseIAPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [formData, setFormData] = useState({
    pacienteId: '',
    medicamentoId: '',
    tipo: 'Avaliação Farmacoterapêutica Geral',
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/analises/ia/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(
          errorData.error ||
            'Erro ao gerar análise com inteligência artificial'
        )
        return
      }

      const data = await response.json()
      setSuccess(true)
      setFormData({
        pacienteId: '',
        medicamentoId: '',
        tipo: 'Avaliação Farmacoterapêutica Geral',
      })

      // Redirecionar para a análise criada após 2 segundos
      setTimeout(() => {
        router.push(`/dashboard/analises/${data.analise.id}`)
      }, 2000)
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/analises"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Análise com IA
          </h1>
          <Sparkles className="h-8 w-8 text-amber-500" />
        </div>
        <p className="text-gray-600 mt-2">
          Gere automaticamente uma análise farmacoterapêutica usando inteligência artificial
        </p>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 flex gap-3 rounded-lg bg-green-50 p-4 border border-green-200">
          <div className="h-5 w-5 text-green-600 flex-shrink-0">✓</div>
          <div>
            <p className="text-sm text-green-700 font-medium">
              Análise gerada com sucesso!
            </p>
            <p className="text-sm text-green-600">
              Redirecionando para a análise criada...
            </p>
          </div>
        </div>
      )}

      <div className="card mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
        <div className="flex gap-3">
          <Sparkles className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Como Funciona?
            </h3>
            <p className="text-sm text-gray-700">
              Selecione um paciente e medicamento. A IA Claude analisará o perfil
              clínico do paciente em relação ao medicamento e gerará uma análise
              farmacoterapêutica completa com achados e recomendações.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informações para Análise
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label-base">Selecione o Paciente *</label>
              <select
                name="pacienteId"
                value={formData.pacienteId}
                onChange={handleChange}
                required
                className="input-base"
                disabled={loading || success}
              >
                <option value="">Selecione um paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.sobrenome}
                  </option>
                ))}
              </select>
              {pacientes.length === 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Nenhum paciente cadastrado.{' '}
                  <Link
                    href="/dashboard/pacientes/novo"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Criar paciente
                  </Link>
                </p>
              )}
            </div>

            <div>
              <label className="label-base">Selecione o Medicamento *</label>
              <select
                name="medicamentoId"
                value={formData.medicamentoId}
                onChange={handleChange}
                required
                className="input-base"
                disabled={loading || success}
              >
                <option value="">Selecione um medicamento...</option>
                {medicamentos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
              {medicamentos.length === 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Nenhum medicamento cadastrado.{' '}
                  <Link
                    href="/dashboard/medicamentos/novo"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Criar medicamento
                  </Link>
                </p>
              )}
            </div>

            <div>
              <label className="label-base">Tipo de Análise</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="input-base"
                disabled={loading || success}
              >
                <option value="Avaliação Farmacoterapêutica Geral">
                  Avaliação Farmacoterapêutica Geral
                </option>
                <option value="Avaliação de Interações Medicamentosas">
                  Avaliação de Interações Medicamentosas
                </option>
                <option value="Avaliação de Contraindicações">
                  Avaliação de Contraindicações
                </option>
                <option value="Avaliação de Reações Adversas">
                  Avaliação de Reações Adversas
                </option>
                <option value="Avaliação de Dosagem Apropriada">
                  Avaliação de Dosagem Apropriada
                </option>
                <option value="Monitoramento Terapêutico">
                  Monitoramento Terapêutico
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={
              loading || success || !formData.pacienteId || !formData.medicamentoId
            }
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando Análise...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar com IA
              </>
            )}
          </button>
          <Link href="/dashboard/analises" className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>

      <div className="mt-8 card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Dica:</h3>
        <p className="text-sm text-gray-700 mb-2">
          Você também pode{' '}
          <Link
            href="/dashboard/analises/nova"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            criar uma análise manualmente
          </Link>
          .
        </p>
        <p className="text-sm text-gray-600">
          Use a geração automática para análises rápidas e sugestões iniciais, ou
          crie manualmente para análises mais customizadas.
        </p>
      </div>
    </div>
  )
}
