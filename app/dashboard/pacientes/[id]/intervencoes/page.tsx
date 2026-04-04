'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2, AlertCircle, Pencil, Trash2 } from 'lucide-react'

const TIPOS: Record<string, string> = {
  PATIENT_ORIENTATION: 'Orientação ao paciente',
  DOSE_ADJUSTMENT: 'Ajuste de dose',
  DOSE_SIMPLIFICATION: 'Simplificação do regime',
  MEDICATION_RECONCILIATION: 'Reconciliação medicamentosa',
  REFERRAL: 'Encaminhamento',
  MEDICATION_SUBSTITUTION: 'Substituição de medicamento',
  MEDICATION_DISCONTINUATION: 'Descontinuação de medicamento',
  FREQUENCY_CHANGE: 'Mudança de frequência',
  INTERACTION_WARNING: 'Alerta de interação',
  CONTRAINDICATION: 'Contraindicação',
  THERAPEUTIC_MONITORING: 'Monitoramento terapêutico',
  ADDITIONAL_THERAPY: 'Terapia adicional',
  OTHER: 'Outros',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceita pelo Prescritor',
  REJECTED: 'Não Aceita',
  IMPLEMENTED: 'Realizada',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  IMPLEMENTED: 'bg-blue-100 text-blue-700',
}

interface PRM { id: string; descricao: string; categoria: string; gravidade: string }
interface Intervencao {
  id: string
  tipo: string
  descricao: string
  justificativa: string
  resultadoEsperado?: string
  status: string
  dataSugestao: string
  resultado?: string
  prm?: PRM
}

const EMPTY_FORM = {
  tipo: 'PATIENT_ORIENTATION',
  descricao: '',
  justificativa: '',
  resultadoEsperado: '',
  status: 'PENDING',
  prmId: '',
  dataSugestao: new Date().toISOString().slice(0, 10),
}

export default function IntervencoesPage() {
  const { id: pacienteId } = useParams() as { id: string }
  const [intervencoes, setIntervencoes] = useState<Intervencao[]>([])
  const [prms, setPrms] = useState<PRM[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { fetchAll() }, [pacienteId])

  const fetchAll = async () => {
    setLoading(true)
    const [intRes, prmRes] = await Promise.all([
      fetch(`/api/intervencoes?pacienteId=${pacienteId}`),
      fetch(`/api/prm?pacienteId=${pacienteId}`),
    ])
    if (intRes.ok) setIntervencoes(await intRes.json())
    if (prmRes.ok) setPrms(await prmRes.json())
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = editing ? `/api/intervencoes/${editing}` : '/api/intervencoes'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pacienteId }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      setShowForm(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      await fetchAll()
    } catch { setError('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const handleEdit = (i: Intervencao) => {
    setForm({
      tipo: i.tipo,
      descricao: i.descricao,
      justificativa: i.justificativa,
      resultadoEsperado: i.resultadoEsperado || '',
      status: i.status,
      prmId: i.prm?.id || '',
      dataSugestao: i.dataSugestao.slice(0, 10),
    })
    setEditing(i.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta intervenção?')) return
    await fetch(`/api/intervencoes/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/pacientes/${pacienteId}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao prontuário
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Intervenções Farmacêuticas</h1>
          <button onClick={() => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova Intervenção
          </button>
        </div>
      </div>

      {error && <div className="mb-4 flex gap-2 rounded-lg bg-red-50 p-4 border border-red-200"><AlertCircle className="h-5 w-5 text-red-600" /><p className="text-sm text-red-700">{error}</p></div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{editing ? 'Editar' : 'Nova'} Intervenção</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Tipo *</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="input-base" required>
                {Object.entries(TIPOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label-base">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-base">
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Data da Intervenção</label>
            <input type="date" value={form.dataSugestao} onChange={e => setForm(f => ({ ...f, dataSugestao: e.target.value }))} className="input-base" />
          </div>

          <div>
            <label className="label-base">Descrição *</label>
            <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} className="input-base" rows={3} required />
          </div>

          <div>
            <label className="label-base">Justificativa *</label>
            <textarea value={form.justificativa} onChange={e => setForm(f => ({ ...f, justificativa: e.target.value }))} className="input-base" rows={2} required />
          </div>

          <div>
            <label className="label-base">Resultado Esperado</label>
            <textarea value={form.resultadoEsperado} onChange={e => setForm(f => ({ ...f, resultadoEsperado: e.target.value }))} className="input-base" rows={2} />
          </div>

          {prms.length > 0 && (
            <div>
              <label className="label-base">PRM Relacionado (opcional)</label>
              <select value={form.prmId} onChange={e => setForm(f => ({ ...f, prmId: e.target.value }))} className="input-base">
                <option value="">Nenhum</option>
                {prms.map(p => <option key={p.id} value={p.id}>{p.descricao.slice(0, 60)} ({p.gravidade})</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {intervencoes.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">Nenhuma intervenção registrada.</div>
      ) : (
        <div className="space-y-4">
          {intervencoes.map(i => (
            <div key={i.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="font-semibold text-gray-900">{TIPOS[i.tipo] || i.tipo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[i.status]}`}>
                      {STATUS_LABELS[i.status]}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(i.dataSugestao).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{i.descricao}</p>
                  <p className="text-xs text-gray-500"><strong>Justificativa:</strong> {i.justificativa}</p>
                  {i.resultadoEsperado && <p className="text-xs text-gray-500 mt-1"><strong>Resultado esperado:</strong> {i.resultadoEsperado}</p>}
                  {i.prm && <p className="text-xs text-blue-600 mt-1">📎 PRM: {i.prm.descricao.slice(0, 60)}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(i)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(i.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
