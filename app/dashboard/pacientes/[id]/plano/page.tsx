'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Trash2, ClipboardList } from 'lucide-react'

interface Monitoramento { exame: string; periodicidade: string; proximaVerificacao: string }
interface Plano {
  id: string
  proximoRetorno?: string
  tipoAtendimentoProgramado?: string
  monitoramentos?: Monitoramento[]
  observacoes?: string
  criadoEm: string
}

const TIPOS_ATENDIMENTO: Record<string, string> = {
  CONSULTA_UBS: 'Consulta UBS',
  CONSULTORIO_FARMACEUTICO: 'Consultório Farmacêutico',
  VISITA_DOMICILIAR: 'Visita Domiciliar',
  TELEATENDIMENTO: 'Teleatendimento',
}

const EMPTY_MON: Monitoramento = { exame: '', periodicidade: '', proximaVerificacao: '' }

export default function PlanoPage() {
  const { id: pacienteId } = useParams() as { id: string }
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    proximoRetorno: '',
    tipoAtendimentoProgramado: '',
    observacoes: '',
    monitoramentos: [] as Monitoramento[],
  })

  useEffect(() => { fetchPlanos() }, [pacienteId])

  const fetchPlanos = async () => {
    setLoading(true)
    const res = await fetch(`/api/plano-acompanhamento?pacienteId=${pacienteId}`)
    if (res.ok) setPlanos(await res.json())
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...form, pacienteId, ...(editandoId ? { id: editandoId } : {}) }
    const method = editandoId ? 'PUT' : 'POST'
    await fetch('/api/plano-acompanhamento', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    setShowForm(false)
    setEditandoId(null)
    setForm({ proximoRetorno: '', tipoAtendimentoProgramado: '', observacoes: '', monitoramentos: [] })
    await fetchPlanos()
  }

  const handleEditar = (p: Plano) => {
    setForm({
      proximoRetorno: p.proximoRetorno ? p.proximoRetorno.slice(0, 10) : '',
      tipoAtendimentoProgramado: p.tipoAtendimentoProgramado || '',
      observacoes: p.observacoes || '',
      monitoramentos: p.monitoramentos || [],
    })
    setEditandoId(p.id)
    setShowForm(true)
  }

  const addMon = () => setForm(f => ({ ...f, monitoramentos: [...f.monitoramentos, { ...EMPTY_MON }] }))
  const removeMon = (i: number) => setForm(f => ({ ...f, monitoramentos: f.monitoramentos.filter((_, idx) => idx !== i) }))
  const updateMon = (i: number, field: keyof Monitoramento, val: string) =>
    setForm(f => ({ ...f, monitoramentos: f.monitoramentos.map((m, idx) => idx === i ? { ...m, [field]: val } : m) }))

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/pacientes/${pacienteId}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao prontuário
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">Plano de Acompanhamento</h1>
          </div>
          <button onClick={() => { setForm({ proximoRetorno: '', tipoAtendimentoProgramado: '', observacoes: '', monitoramentos: [] }); setEditandoId(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Plano
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{editandoId ? 'Editar' : 'Novo'} Plano</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Próximo Retorno</label>
              <input type="date" value={form.proximoRetorno} onChange={e => setForm(f => ({ ...f, proximoRetorno: e.target.value }))} className="input-base" />
            </div>
            <div>
              <label className="label-base">Tipo de Atendimento Programado</label>
              <select value={form.tipoAtendimentoProgramado} onChange={e => setForm(f => ({ ...f, tipoAtendimentoProgramado: e.target.value }))} className="input-base">
                <option value="">Selecione...</option>
                {Object.entries(TIPOS_ATENDIMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-base mb-0">Monitoramentos Programados</label>
              <button type="button" onClick={addMon} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"><Plus className="h-3 w-3" /> Adicionar</button>
            </div>
            <div className="space-y-3">
              {form.monitoramentos.map((m, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-center">
                  <input value={m.exame} onChange={e => updateMon(i, 'exame', e.target.value)} className="input-base" placeholder="Exame" />
                  <input value={m.periodicidade} onChange={e => updateMon(i, 'periodicidade', e.target.value)} className="input-base" placeholder="Periodicidade" />
                  <div className="flex gap-2">
                    <input type="date" value={m.proximaVerificacao} onChange={e => updateMon(i, 'proximaVerificacao', e.target.value)} className="input-base flex-1" />
                    <button type="button" onClick={() => removeMon(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label-base">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} className="input-base" rows={3} />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {planos.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">Nenhum plano de acompanhamento registrado.</div>
      ) : (
        <div className="space-y-4">
          {planos.map(p => (
            <div key={p.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {p.proximoRetorno && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">📅</span>
                      <div>
                        <p className="font-semibold text-gray-900">Próximo Retorno</p>
                        <p className="text-blue-700 font-medium">{new Date(p.proximoRetorno).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        {p.tipoAtendimentoProgramado && <p className="text-sm text-gray-500">{TIPOS_ATENDIMENTO[p.tipoAtendimentoProgramado] || p.tipoAtendimentoProgramado}</p>}
                      </div>
                    </div>
                  )}

                  {p.monitoramentos && p.monitoramentos.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Monitoramentos</p>
                      <div className="space-y-1">
                        {p.monitoramentos.map((m, i) => (
                          <div key={i} className="flex gap-4 text-sm text-gray-600">
                            <span className="font-medium">{m.exame}</span>
                            <span className="text-gray-400">•</span>
                            <span>{m.periodicidade}</span>
                            {m.proximaVerificacao && <><span className="text-gray-400">•</span><span>Próx: {new Date(m.proximaVerificacao).toLocaleDateString('pt-BR')}</span></>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.observacoes && <p className="text-sm text-gray-600 italic">{p.observacoes}</p>}
                  <p className="text-xs text-gray-400 mt-2">Criado em {new Date(p.criadoEm).toLocaleDateString('pt-BR')}</p>
                </div>
                <button onClick={() => handleEditar(p)} className="btn-secondary text-sm ml-4">Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
