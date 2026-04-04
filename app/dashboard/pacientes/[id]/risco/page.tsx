'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, ShieldAlert, RefreshCw } from 'lucide-react'

interface Estratificacao {
  id: string
  nivelRisco: 'BAIXO' | 'MODERADO' | 'ALTO'
  pontuacaoAuto: number
  ajusteManual: boolean
  justificativa?: string
  calculadoEm: string
}

const NIVEL_STYLE = {
  BAIXO: { badge: 'bg-green-100 text-green-800 border-green-300', label: 'Baixo Risco', icon: '🟢' },
  MODERADO: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Risco Moderado', icon: '🟡' },
  ALTO: { badge: 'bg-red-100 text-red-800 border-red-300', label: 'Alto Risco', icon: '🔴' },
}

export default function RiscoPage() {
  const { id: pacienteId } = useParams() as { id: string }
  const [historico, setHistorico] = useState<Estratificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [showAjuste, setShowAjuste] = useState(false)
  const [nivelManual, setNivelManual] = useState<'BAIXO' | 'MODERADO' | 'ALTO'>('MODERADO')
  const [justificativa, setJustificativa] = useState('')

  useEffect(() => { fetchHistorico() }, [pacienteId])

  const fetchHistorico = async () => {
    setLoading(true)
    const res = await fetch(`/api/estratificacao-risco?pacienteId=${pacienteId}`)
    if (res.ok) setHistorico(await res.json())
    setLoading(false)
  }

  const calcular = async (ajusteManual = false) => {
    setCalculando(true)
    const body = ajusteManual
      ? { pacienteId, ajusteManual: true, nivelRiscoManual: nivelManual, justificativa }
      : { pacienteId }
    const res = await fetch('/api/estratificacao-risco', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      await fetchHistorico()
      setShowAjuste(false)
      setJustificativa('')
    }
    setCalculando(false)
  }

  const atual = historico[0]

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/pacientes/${pacienteId}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao prontuário
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">Estratificação de Risco</h1>
          </div>
          <button onClick={() => calcular()} disabled={calculando} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {calculando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recalcular
          </button>
        </div>
      </div>

      {/* Nível atual */}
      {atual ? (
        <div className={`card mb-6 border-2 ${NIVEL_STYLE[atual.nivelRisco].badge}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nível de Risco Atual</p>
              <p className="text-3xl font-bold">
                {NIVEL_STYLE[atual.nivelRisco].icon} {NIVEL_STYLE[atual.nivelRisco].label}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Pontuação: {atual.pontuacaoAuto} pts · Calculado em {new Date(atual.calculadoEm).toLocaleDateString('pt-BR')}
                {atual.ajusteManual && ' · Ajuste manual'}
              </p>
              {atual.justificativa && <p className="text-sm text-gray-700 mt-1 italic">"{atual.justificativa}"</p>}
            </div>
            <button onClick={() => setShowAjuste(!showAjuste)} className="btn-secondary text-sm">
              Ajuste Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="card mb-6 text-center py-8 text-gray-500">
          <p>Nenhuma estratificação calculada ainda.</p>
          <button onClick={() => calcular()} disabled={calculando} className="btn-primary mt-4 flex items-center gap-2 mx-auto">
            {calculando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Calcular Agora
          </button>
        </div>
      )}

      {showAjuste && (
        <div className="card mb-6 space-y-4 border border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-gray-900">Ajuste Manual do Nível de Risco</h3>
          <div>
            <label className="label-base">Nível de Risco</label>
            <select value={nivelManual} onChange={e => setNivelManual(e.target.value as typeof nivelManual)} className="input-base">
              <option value="BAIXO">🟢 Baixo Risco</option>
              <option value="MODERADO">🟡 Risco Moderado</option>
              <option value="ALTO">🔴 Alto Risco</option>
            </select>
          </div>
          <div>
            <label className="label-base">Justificativa *</label>
            <textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} className="input-base" rows={2} required />
          </div>
          <div className="flex gap-3">
            <button onClick={() => calcular(true)} disabled={!justificativa || calculando} className="btn-primary disabled:opacity-50">
              Aplicar Ajuste
            </button>
            <button onClick={() => setShowAjuste(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {/* Histórico */}
      {historico.length > 1 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Histórico de Estratificações</h2>
          <div className="space-y-3">
            {historico.slice(1).map(e => (
              <div key={e.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{NIVEL_STYLE[e.nivelRisco].icon}</span>
                  <span className="text-gray-700">{NIVEL_STYLE[e.nivelRisco].label}</span>
                  {e.ajusteManual && <span className="text-xs text-gray-400">(manual)</span>}
                </div>
                <span className="text-gray-400">{new Date(e.calculadoEm).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
