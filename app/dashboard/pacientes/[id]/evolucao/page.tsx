'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react'

interface DadosClinicos {
  peso?: number; altura?: number; paSistolica?: number; paDiastolica?: number
  freqCardiaca?: number; glicemiaCapilar?: number
}
interface Atendimento { id: string; tipo: string; dataAtendimento: string; dadosClinicos?: DadosClinicos }
interface PRM { id: string; descricao: string; gravidade: string }
interface ResolucaoPRM { prmId: string; descricao: string; status: 'RESOLVIDO' | 'EM_MELHORA' | 'SEM_MELHORA' | 'PIOROU' }
interface Evolucao {
  id: string; atendimentoId: string; adesao?: string; adesaoObs?: string
  evolucaoTexto?: string; resolucaoPrms?: ResolucaoPRM[]; criadoEm: string
  atendimento: Atendimento
}

const ADESAO_COLORS: Record<string, string> = { BOA: 'text-green-700', REGULAR: 'text-yellow-700', BAIXA: 'text-red-700' }
const STATUS_PRM_COLORS: Record<string, string> = {
  RESOLVIDO: 'bg-green-100 text-green-700',
  EM_MELHORA: 'bg-blue-100 text-blue-700',
  SEM_MELHORA: 'bg-yellow-100 text-yellow-700',
  PIOROU: 'bg-red-100 text-red-700',
}
const STATUS_PRM_LABELS: Record<string, string> = { RESOLVIDO: 'Resolvido', EM_MELHORA: 'Em Melhora', SEM_MELHORA: 'Sem Melhora', PIOROU: 'Piorou' }

export default function EvolucaoPage() {
  const { id: pacienteId } = useParams() as { id: string }
  const [evolucoes, setEvolucoes] = useState<Evolucao[]>([])
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [prms, setPrms] = useState<PRM[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [atendimentoSel, setAtendimentoSel] = useState('')
  const [form, setForm] = useState({ adesao: '', adesaoObs: '', evolucaoTexto: '', resolucaoPrms: [] as ResolucaoPRM[] })

  useEffect(() => { fetchAll() }, [pacienteId])

  const fetchAll = async () => {
    setLoading(true)
    const [evRes, atRes, prmRes] = await Promise.all([
      fetch(`/api/evolucao-clinica?pacienteId=${pacienteId}`),
      fetch(`/api/atendimentos?pacienteId=${pacienteId}`),
      fetch(`/api/prf?pacienteId=${pacienteId}`),
    ])
    if (evRes.ok) setEvolucoes(await evRes.json())
    if (atRes.ok) setAtendimentos(await atRes.json())
    if (prmRes.ok) setPrms(await prmRes.json())
    setLoading(false)
  }

  const atendimentosSemEvolucao = atendimentos.filter(a => !evolucoes.find(e => e.atendimentoId === a.id))

  const initPrms = () => prms.map(p => ({ prmId: p.id, descricao: p.descricao, status: 'SEM_MELHORA' as const }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!atendimentoSel) return
    setSaving(true)
    await fetch('/api/evolucao-clinica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pacienteId, atendimentoId: atendimentoSel, ...form }),
    })
    setSaving(false)
    setShowForm(false)
    setAtendimentoSel('')
    setForm({ adesao: '', adesaoObs: '', evolucaoTexto: '', resolucaoPrms: [] })
    await fetchAll()
  }

  const getDelta = (ev: Evolucao, campo: keyof DadosClinicos) => {
    const idx = evolucoes.indexOf(ev)
    const anterior = evolucoes[idx + 1]
    const valAtual = ev.atendimento.dadosClinicos?.[campo]
    const valAnterior = anterior?.atendimento.dadosClinicos?.[campo]
    if (valAtual == null || valAnterior == null) return null
    const diff = Number(valAtual) - Number(valAnterior)
    return { diff, up: diff > 0 }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/pacientes/${pacienteId}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao prontuário
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">Evolução Clínica</h1>
          </div>
          {atendimentosSemEvolucao.length > 0 && (
            <button onClick={() => { setForm({ adesao: '', adesaoObs: '', evolucaoTexto: '', resolucaoPrms: initPrms() }); setShowForm(true) }} className="btn-primary">
              + Registrar Evolução
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Nova Evolução</h2>

          <div>
            <label className="label-base">Atendimento de Retorno *</label>
            <select value={atendimentoSel} onChange={e => setAtendimentoSel(e.target.value)} className="input-base" required>
              <option value="">Selecione...</option>
              {atendimentosSemEvolucao.map(a => (
                <option key={a.id} value={a.id}>
                  {new Date(a.dataAtendimento).toLocaleDateString('pt-BR')} — {a.tipo.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Adesão ao Tratamento</label>
              <select value={form.adesao} onChange={e => setForm(f => ({ ...f, adesao: e.target.value }))} className="input-base">
                <option value="">Selecione...</option>
                <option value="BOA">Boa</option>
                <option value="REGULAR">Regular</option>
                <option value="BAIXA">Baixa</option>
              </select>
            </div>
            <div>
              <label className="label-base">Obs. Adesão</label>
              <input value={form.adesaoObs} onChange={e => setForm(f => ({ ...f, adesaoObs: e.target.value }))} className="input-base" />
            </div>
          </div>

          <div>
            <label className="label-base">Evolução Clínica Geral</label>
            <textarea value={form.evolucaoTexto} onChange={e => setForm(f => ({ ...f, evolucaoTexto: e.target.value }))} className="input-base" rows={4} placeholder="Descreva a evolução clínica do paciente (SOAP, livre...)..." />
          </div>

          {form.resolucaoPrms.length > 0 && (
            <div>
              <label className="label-base">Status dos PRFs</label>
              <div className="space-y-2">
                {form.resolucaoPrms.map((r, i) => (
                  <div key={r.prmId} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 flex-1 truncate">{r.descricao.slice(0, 50)}</span>
                    <select
                      value={r.status}
                      onChange={e => setForm(f => ({ ...f, resolucaoPrms: f.resolucaoPrms.map((x, idx) => idx === i ? { ...x, status: e.target.value as ResolucaoPRM['status'] } : x) }))}
                      className="input-base w-auto text-sm"
                    >
                      <option value="RESOLVIDO">Resolvido</option>
                      <option value="EM_MELHORA">Em Melhora</option>
                      <option value="SEM_MELHORA">Sem Melhora</option>
                      <option value="PIOROU">Piorou</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={saving || !atendimentoSel} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {/* Timeline */}
      {evolucoes.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">Nenhuma evolução registrada.</div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-6">
            {evolucoes.map((ev, idx) => {
              const deltaPeso = getDelta(ev, 'peso')
              const deltaPA = getDelta(ev, 'paSistolica')
              return (
                <div key={ev.id} className="relative pl-14">
                  <div className="absolute left-3 w-4 h-4 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-200 top-1.5" />
                  <div className="card">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-900">
                        {new Date(ev.atendimento.dataAtendimento).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {ev.adesao && (
                        <span className={`text-sm font-medium ${ADESAO_COLORS[ev.adesao]}`}>
                          Adesão: {ev.adesao === 'BOA' ? 'Boa' : ev.adesao === 'REGULAR' ? 'Regular' : 'Baixa'}
                        </span>
                      )}
                    </div>

                    {/* Deltas clínicos */}
                    {(deltaPeso || deltaPA) && idx < evolucoes.length - 1 && (
                      <div className="flex gap-4 mb-3 flex-wrap">
                        {deltaPeso && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${deltaPeso.diff < 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                            Peso: {deltaPeso.diff > 0 ? '+' : ''}{deltaPeso.diff.toFixed(1)} kg
                          </span>
                        )}
                        {deltaPA && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${deltaPA.diff < 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                            PAS: {deltaPA.diff > 0 ? '+' : ''}{deltaPA.diff} mmHg
                          </span>
                        )}
                      </div>
                    )}

                    {ev.evolucaoTexto && <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{ev.evolucaoTexto}</p>}

                    {ev.resolucaoPrms && ev.resolucaoPrms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {ev.resolucaoPrms.map(r => (
                          <span key={r.prmId} className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PRM_COLORS[r.status]}`}>
                            {r.descricao.slice(0, 30)}: {STATUS_PRM_LABELS[r.status]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
