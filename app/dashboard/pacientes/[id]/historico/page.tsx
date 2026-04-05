'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Filter } from 'lucide-react'

interface AuditLog {
  id: string
  entidade: string
  acao: string
  dados: string
  usuarioNome?: string
  criadoEm: string
}

const TIPO_LABELS: Record<string, string> = {
  CRIACAO_PACIENTE: 'Cadastro de Paciente',
  EDICAO_PACIENTE: 'Edicao de Paciente',
  NOVO_ATENDIMENTO: 'Novo Atendimento',
  NOVO_PRM: 'Novo PRM',
  NOVA_INTERVENCAO: 'Nova Intervencao',
  NOVO_EXAME: 'Novo Exame',
  NOVO_MEDICAMENTO: 'Novo Medicamento',
  ALERTA_GERADO: 'Alerta Clinico Gerado',
  ANEXO_ADICIONADO: 'Anexo Adicionado',
  CARTA_GERADA: 'Carta ao Prescritor',
}

const TIPO_CORES: Record<string, string> = {
  CRIACAO_PACIENTE: 'bg-green-100 text-green-700',
  EDICAO_PACIENTE: 'bg-blue-100 text-blue-700',
  NOVO_ATENDIMENTO: 'bg-purple-100 text-purple-700',
  NOVO_PRM: 'bg-orange-100 text-orange-700',
  NOVA_INTERVENCAO: 'bg-teal-100 text-teal-700',
  ALERTA_GERADO: 'bg-red-100 text-red-700',
  ANEXO_ADICIONADO: 'bg-gray-100 text-gray-700',
}

export default function HistoricoPage() {
  const params = useParams()
  const pacienteId = params.id as string
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ pacienteId })
      if (filtroTipo) q.set('tipo', filtroTipo)
      if (from) q.set('from', from)
      if (to) q.set('to', to)
      const r = await fetch(`/api/audit-logs?${q}`)
      if (r.ok) setLogs(await r.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [pacienteId, filtroTipo, from, to])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/pacientes/${pacienteId}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Historico de Alteracoes</h1>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tipo de Evento</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="input text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(TIPO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">De</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ate</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input text-sm" />
        </div>
        <button
          onClick={() => { setFiltroTipo(''); setFrom(''); setTo('') }}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Limpar
        </button>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Nenhum registro encontrado
          </div>
        ) : (
          <div className="relative pl-8 py-4">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            {logs.map((log, i) => (
              <div key={log.id} className={`relative mb-6 ${i === logs.length - 1 ? 'mb-0' : ''}`}>
                <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-white border-2 border-blue-400" />
                <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            TIPO_CORES[log.entidade] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {TIPO_LABELS[log.entidade] ?? log.entidade}
                        </span>
                        {log.usuarioNome && (
                          <span className="text-xs text-gray-500">por {log.usuarioNome}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{log.acao}</p>
                    </div>
                    <time className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.criadoEm).toLocaleString('pt-BR')}
                    </time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
