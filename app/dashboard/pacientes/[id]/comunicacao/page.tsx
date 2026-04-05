'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, CheckCircle, Circle, Mail, ClipboardList, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface Carta {
  id: string
  destinatario: string
  assunto: string
  corpo: string
  criadoEm: string
  usuario: { nome: string; sobrenome: string }
}

interface Tarefa {
  id: string
  descricao: string
  prioridade: string
  prazo?: string
  concluida: boolean
  criadoEm: string
}

const PRIORIDADE_CORES: Record<string, string> = {
  BAIXA: 'text-green-600 bg-green-50 border-green-200',
  MEDIA: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  ALTA: 'text-red-600 bg-red-50 border-red-200',
}

export default function ComunicacaoPage() {
  const params = useParams()
  const pacienteId = params.id as string

  const [cartas, setCartas] = useState<Carta[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'tarefas' | 'cartas'>('tarefas')

  // Nova tarefa
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novaPrioridade, setNovaPrioridade] = useState('MEDIA')
  const [novoPrazo, setNovoPrazo] = useState('')
  const [salvandoTarefa, setSalvandoTarefa] = useState(false)

  // Nova carta
  const [novaCarta, setNovaCarta] = useState({ destinatario: '', assunto: '', corpo: '' })
  const [salvandoCarta, setSalvandoCarta] = useState(false)
  const [cartaExpandida, setCartaExpandida] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/tarefas?pacienteId=${pacienteId}`).then((r) => r.json()),
      fetch(`/api/cartas?pacienteId=${pacienteId}`).then((r) => r.json()),
    ]).then(([t, c]) => {
      setTarefas(t)
      setCartas(c)
    }).finally(() => setLoading(false))
  }, [pacienteId])

  const criarTarefa = async () => {
    if (!novaDescricao.trim()) return
    setSalvandoTarefa(true)
    try {
      const r = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId, descricao: novaDescricao, prioridade: novaPrioridade, prazo: novoPrazo || null }),
      })
      if (r.ok) {
        const t = await r.json()
        setTarefas((prev) => [t, ...prev])
        setNovaDescricao('')
        setNovoPrazo('')
      }
    } finally {
      setSalvandoTarefa(false)
    }
  }

  const toggleTarefa = async (id: string, concluida: boolean) => {
    await fetch('/api/tarefas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, concluida: !concluida }),
    })
    setTarefas((prev) => prev.map((t) => t.id === id ? { ...t, concluida: !concluida } : t))
  }

  const deletarTarefa = async (id: string) => {
    if (!confirm('Remover esta tarefa?')) return
    await fetch(`/api/tarefas?id=${id}`, { method: 'DELETE' })
    setTarefas((prev) => prev.filter((t) => t.id !== id))
  }

  const criarCarta = async () => {
    if (!novaCarta.destinatario || !novaCarta.corpo) return
    setSalvandoCarta(true)
    try {
      const r = await fetch('/api/cartas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId, ...novaCarta }),
      })
      if (r.ok) {
        const c = await r.json()
        setCartas((prev) => [{ ...c, usuario: { nome: '', sobrenome: '' } }, ...prev])
        setNovaCarta({ destinatario: '', assunto: '', corpo: '' })
      }
    } finally {
      setSalvandoCarta(false)
    }
  }

  const deletarCarta = async (id: string) => {
    if (!confirm('Remover esta carta?')) return
    await fetch(`/api/cartas?id=${id}`, { method: 'DELETE' })
    setCartas((prev) => prev.filter((c) => c.id !== id))
  }

  const pendentes = tarefas.filter((t) => !t.concluida)
  const concluidas = tarefas.filter((t) => t.concluida)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/pacientes/${pacienteId}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Comunicacao e Tarefas</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('tarefas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'tarefas'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Tarefas
          {pendentes.length > 0 && (
            <span className="rounded-full bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5">
              {pendentes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('cartas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'cartas'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail className="h-4 w-4" />
          Cartas ao Prescritor
          {cartas.length > 0 && (
            <span className="rounded-full bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5">
              {cartas.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : tab === 'tarefas' ? (
        <div className="space-y-4">
          {/* Nova tarefa */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Nova Tarefa</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && criarTarefa()}
                placeholder="Descricao da tarefa..."
                className="input flex-1 text-sm"
              />
              <select
                value={novaPrioridade}
                onChange={(e) => setNovaPrioridade(e.target.value)}
                className="input text-sm w-28"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>
              <input
                type="date"
                value={novoPrazo}
                onChange={(e) => setNovoPrazo(e.target.value)}
                className="input text-sm"
              />
              <button
                onClick={criarTarefa}
                disabled={salvandoTarefa || !novaDescricao.trim()}
                className="btn-primary flex items-center gap-1 text-sm"
              >
                {salvandoTarefa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar
              </button>
            </div>
          </div>

          {/* Pendentes */}
          {pendentes.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
              {pendentes.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                  <button onClick={() => toggleTarefa(t.id, t.concluida)}>
                    <Circle className="h-5 w-5 text-gray-300 hover:text-blue-500" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{t.descricao}</p>
                    {t.prazo && (
                      <p className="text-xs text-gray-500">
                        Prazo: {new Date(t.prazo).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${PRIORIDADE_CORES[t.prioridade]}`}>
                    {t.prioridade}
                  </span>
                  <button onClick={() => deletarTarefa(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendentes.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
              Nenhuma tarefa pendente
            </div>
          )}

          {/* Concluidas */}
          {concluidas.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Concluidas ({concluidas.length})</p>
              <div className="rounded-lg border border-gray-100 bg-white divide-y divide-gray-50 opacity-70">
                {concluidas.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3">
                    <button onClick={() => toggleTarefa(t.id, t.concluida)}>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </button>
                    <p className="text-sm text-gray-500 line-through flex-1">{t.descricao}</p>
                    <button onClick={() => deletarTarefa(t.id)} className="p-1.5 text-gray-300 hover:text-red-400 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Nova carta */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Nova Carta ao Prescritor</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Destinatario</label>
                <input
                  type="text"
                  value={novaCarta.destinatario}
                  onChange={(e) => setNovaCarta((p) => ({ ...p, destinatario: e.target.value }))}
                  placeholder="Dr. Nome do Medico"
                  className="input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Assunto</label>
                <input
                  type="text"
                  value={novaCarta.assunto}
                  onChange={(e) => setNovaCarta((p) => ({ ...p, assunto: e.target.value }))}
                  placeholder="Ex: Possivel interacao medicamentosa"
                  className="input w-full text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Corpo da Carta</label>
              <textarea
                value={novaCarta.corpo}
                onChange={(e) => setNovaCarta((p) => ({ ...p, corpo: e.target.value }))}
                rows={5}
                className="input w-full text-sm"
                placeholder="Texto da carta..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={criarCarta}
                disabled={salvandoCarta || !novaCarta.destinatario || !novaCarta.corpo}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {salvandoCarta ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Salvar Carta
              </button>
            </div>
          </div>

          {/* Lista cartas */}
          {cartas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
              Nenhuma carta cadastrada
            </div>
          ) : (
            <div className="space-y-3">
              {cartas.map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">Para: {c.destinatario}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {c.assunto || 'Sem assunto'} &middot; {new Date(c.criadoEm).toLocaleDateString('pt-BR')}
                        {c.usuario?.nome && ` &middot; ${c.usuario.nome} ${c.usuario.sobrenome}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCartaExpandida(cartaExpandida === c.id ? null : c.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      >
                        {cartaExpandida === c.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <button onClick={() => deletarCarta(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {cartaExpandida === c.id && (
                    <div className="border-t border-gray-100 p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{c.corpo}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
