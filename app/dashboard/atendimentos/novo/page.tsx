'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

const TIPOS_ATENDIMENTO = [
  { value: 'CONSULTA_UBS', label: 'Consulta na UBS' },
  { value: 'CONSULTORIO_FARMACEUTICO', label: 'Consultório Farmacêutico' },
  { value: 'VISITA_DOMICILIAR', label: 'Visita Domiciliar' },
  { value: 'TELEATENDIMENTO', label: 'Teleatendimento' },
]

const MOTIVOS_CONSULTA = [
  { value: 'INICIO_TRATAMENTO', label: 'Início de Tratamento' },
  { value: 'REVISAO_MEDICAMENTOS', label: 'Revisão de Medicamentos' },
  { value: 'EFEITO_ADVERSO', label: 'Efeito Adverso' },
  { value: 'MONITORAMENTO', label: 'Monitoramento' },
  { value: 'ADESAO', label: 'Adesão ao Tratamento' },
  { value: 'RETORNO', label: 'Retorno' },
  { value: 'OUTROS', label: 'Outros' },
]

export default function NovoAtendimentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pacienteIdParam = searchParams.get('pacienteId') || ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    pacienteId: pacienteIdParam,
    tipo: '',
    enderecoVisita: '',
    motivoConsulta: [] as string[],
    motivoDescricao: '',
    dataAtendimento: new Date().toISOString().split('T')[0],
  })

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, tipo: e.target.value, enderecoVisita: '' })
  }

  const handleMotivoToggle = (motivo: string) => {
    const current = formData.motivoConsulta
    const updated = current.includes(motivo)
      ? current.filter((m) => m !== motivo)
      : [...current, motivo]
    setFormData({ ...formData, motivoConsulta: updated })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.pacienteId) {
      setError('Selecione um paciente')
      return
    }
    if (!formData.tipo) {
      setError('Selecione o tipo de atendimento')
      return
    }
    if (formData.tipo === 'VISITA_DOMICILIAR' && !formData.enderecoVisita.trim()) {
      setError('Informe o endereço da visita domiciliar')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao criar atendimento')
        return
      }

      // Redireciona de volta ao prontuário do paciente
      router.push(`/dashboard/pacientes/${formData.pacienteId}`)
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Novo Atendimento</h1>
        <p className="text-gray-600 mt-2">Registre uma nova sessão clínica</p>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Data do Atendimento */}
        <div>
          <label className="label-base">Data do Atendimento *</label>
          <input
            type="date"
            value={formData.dataAtendimento}
            onChange={(e) => setFormData({ ...formData, dataAtendimento: e.target.value })}
            required
            className="input-base"
            disabled={loading}
          />
        </div>

        {/* Tipo de Atendimento */}
        <div>
          <label className="label-base">Tipo de Atendimento *</label>
          <select
            value={formData.tipo}
            onChange={handleTipoChange}
            required
            className="input-base"
            disabled={loading}
          >
            <option value="">Selecione o tipo...</option>
            {TIPOS_ATENDIMENTO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Endereço da Visita — apenas para VISITA_DOMICILIAR */}
        {formData.tipo === 'VISITA_DOMICILIAR' && (
          <div>
            <label className="label-base">Endereço da Visita *</label>
            <input
              type="text"
              value={formData.enderecoVisita}
              onChange={(e) => setFormData({ ...formData, enderecoVisita: e.target.value })}
              required
              placeholder="Rua, número, bairro, cidade"
              className="input-base"
              disabled={loading}
            />
          </div>
        )}

        {/* Motivo da Consulta */}
        <div>
          <label className="label-base">Motivo da Consulta</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {MOTIVOS_CONSULTA.map((motivo) => (
              <label
                key={motivo.value}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.motivoConsulta.includes(motivo.value)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.motivoConsulta.includes(motivo.value)}
                  onChange={() => handleMotivoToggle(motivo.value)}
                  className="sr-only"
                  disabled={loading}
                />
                <span className="text-sm">{motivo.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Descrição Complementar */}
        <div>
          <label className="label-base">Descrição Complementar</label>
          <textarea
            value={formData.motivoDescricao}
            onChange={(e) => setFormData({ ...formData, motivoDescricao: e.target.value })}
            rows={3}
            placeholder="Descreva detalhes adicionais sobre o motivo da consulta..."
            className="input-base"
            disabled={loading}
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Iniciar Atendimento'
            )}
          </button>
          <Link
            href={pacienteIdParam ? `/dashboard/pacientes/${pacienteIdParam}` : '/dashboard/pacientes'}
            className="btn-secondary"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
