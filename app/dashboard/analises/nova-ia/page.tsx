'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Sparkles, ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { MODEL_OPTIONS } from '@/lib/ai-providers'

interface Paciente {
  id: string
  nome: string
  sobrenome: string
}

interface Medicamento {
  id: string
  nome: string
}

interface IAConfig {
  provedorPadrao: string
  modeloPadrao: string
  temGroq: boolean
  temGemini: boolean
}

export default function NovaAnáliseIAPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [iaConfig, setIaConfig] = useState<IAConfig | null>(null)

  const [formData, setFormData] = useState({
    pacienteId: '',
    medicamentoId: '',
    tipo: 'Avaliação Farmacoterapêutica Geral',
    provedor: '',
    modelo: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      const [pacientesRes, medicamentosRes, iaConfigRes] = await Promise.all([
        fetch('/api/pacientes?limit=1000'),
        fetch('/api/medicamentos?limit=1000'),
        fetch('/api/configuracoes/ia'),
      ])

      if (!pacientesRes.ok || !medicamentosRes.ok) {
        throw new Error('Erro ao carregar dados')
      }

      const pacientesData = await pacientesRes.json()
      const medicamentosData = await medicamentosRes.json()

      // /api/pacientes retorna array direto ou objeto com .pacientes
      const pacientesArray = Array.isArray(pacientesData)
        ? pacientesData
        : pacientesData.pacientes ?? []
      const medicamentosArray = Array.isArray(medicamentosData)
        ? medicamentosData
        : medicamentosData.medicamentos ?? []

      setPacientes(pacientesArray)
      setMedicamentos(medicamentosArray)

      if (iaConfigRes.ok) {
        const cfg = await iaConfigRes.json()
        setIaConfig(cfg)
        setFormData((prev) => ({
          ...prev,
          provedor: cfg.provedorPadrao ?? 'anthropic',
          modelo: cfg.modeloPadrao ?? 'claude-sonnet-4-6',
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoadingData(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    if (name === 'provedor') {
      const firstModel = MODEL_OPTIONS.find((m) => m.provider === value)
      setFormData((prev) => ({
        ...prev,
        provedor: value,
        modelo: firstModel?.model ?? prev.modelo,
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
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
        body: JSON.stringify({
          pacienteId: formData.pacienteId,
          medicamentoId: formData.medicamentoId,
          tipo: formData.tipo,
          provedor: formData.provedor || undefined,
          modelo: formData.modelo || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao gerar análise com inteligência artificial')
        return
      }

      const data = await response.json()
      setSuccess(true)

      setTimeout(() => {
        router.push(`/dashboard/analises/${data.analise.id}`)
      }, 2000)
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const modelsForProvider = MODEL_OPTIONS.filter((m) => m.provider === formData.provedor)

  const providerNeedsKey =
    (formData.provedor === 'groq' && iaConfig && !iaConfig.temGroq) ||
    (formData.provedor === 'gemini' && iaConfig && !iaConfig.temGemini)

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
          <h1 className="text-3xl font-bold text-gray-900">Análise com IA</h1>
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
            <p className="text-sm text-green-700 font-medium">Análise gerada com sucesso!</p>
            <p className="text-sm text-green-600">Redirecionando para a análise criada...</p>
          </div>
        </div>
      )}

      {providerNeedsKey && (
        <div className="mb-6 flex gap-3 rounded-lg bg-amber-50 p-4 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Chave API não configurada para este provedor.</p>
            <Link
              href="/dashboard/configuracoes"
              className="inline-flex items-center gap-1 mt-1 text-amber-800 underline hover:text-amber-900"
            >
              <Settings className="h-3 w-3" />
              Configurar em Configurações
            </Link>
          </div>
        </div>
      )}

      <div className="card mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
        <div className="flex gap-3">
          <Sparkles className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Como Funciona?</h3>
            <p className="text-sm text-gray-700">
              Selecione um paciente e medicamento. A IA analisará o perfil clínico do paciente em
              relação ao medicamento e gerará uma análise farmacoterapêutica completa com achados e
              recomendações.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Modelo de IA</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Provedor</label>
              <select
                name="provedor"
                value={formData.provedor}
                onChange={handleChange}
                className="input-base"
                disabled={loading || success}
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="groq">Groq</option>
                <option value="gemini">Google (Gemini / Gemma)</option>
              </select>
            </div>
            <div>
              <label className="label-base">Modelo</label>
              <select
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                className="input-base"
                disabled={loading || success}
              >
                {modelsForProvider.map((m) => (
                  <option key={m.model} value={m.model}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações para Análise</h2>
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
                  <Link href="/dashboard/pacientes/novo" className="text-blue-600 hover:text-blue-700">
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
                  <Link href="/dashboard/medicamentos/novo" className="text-blue-600 hover:text-blue-700">
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
                <option value="Avaliação de Reações Adversas">Avaliação de Reações Adversas</option>
                <option value="Avaliação de Dosagem Apropriada">
                  Avaliação de Dosagem Apropriada
                </option>
                <option value="Monitoramento Terapêutico">Monitoramento Terapêutico</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={
              loading ||
              success ||
              !formData.pacienteId ||
              !formData.medicamentoId ||
              !!providerNeedsKey
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
          <Link href="/dashboard/analises/nova" className="text-blue-600 hover:text-blue-700 font-medium">
            criar uma análise manualmente
          </Link>
          .
        </p>
        <p className="text-sm text-gray-600">
          Para usar Groq ou Google Gemini/Gemma, configure suas chaves em{' '}
          <Link href="/dashboard/configuracoes" className="text-blue-600 hover:text-blue-700 font-medium">
            Configurações
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
