'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  Loader2,
  Plus,
  Calendar,
  ClipboardList,
  ChevronRight,
  CheckCircle,
  Clock,
  Pencil,
  Bell,
  RefreshCw,
} from 'lucide-react'
import { formatarCPF } from '@/lib/cpf'

interface Paciente {
  id: string
  nome: string
  sobrenome: string
  cpf: string
  dataNascimento: string
  genero: string
  telefone?: string
  telefoneSecundario?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  unidadeSaude?: string
  profissionalResponsavel?: string
  notas?: string
  ativo: boolean
  atendimentos: Atendimento[]
  historicoClinico: HistoricoClinico[]
}

interface Atendimento {
  id: string
  tipo: string
  motivoConsulta: string[]
  dataAtendimento: string
  status: string
  criadoEm: string
  dadosClinicos?: DadosClinicos
}

interface DadosClinicos {
  peso?: number
  altura?: number
  imc?: number
  classificacaoImc?: string
  paSistolica?: number
  paDiastolica?: number
  freqCardiaca?: number
  glicemiaCapilar?: number
}

interface AlertaClinico {
  id: string
  tipo: string
  severidade: string
  descricao: string
  medicamentosEnvolvidos?: string
  sugestaoAcao?: string
  estado: string
}

interface HistoricoClinico {
  id: string
  doenca: string
  cid10?: string
  dataDiagnostico?: string
  status: string
  observacoes?: string
}

const TIPO_LABELS: Record<string, string> = {
  CONSULTA_UBS: 'Consulta UBS',
  CONSULTORIO_FARMACEUTICO: 'Consultório Farmacêutico',
  VISITA_DOMICILIAR: 'Visita Domiciliar',
  TELEATENDIMENTO: 'Teleatendimento',
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export default function ProntuarioPacientePage() {
  const params = useParams()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [alertas, setAlertas] = useState<AlertaClinico[]>([])
  const [gerandoAlertas, setGerandoAlertas] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const response = await fetch(`/api/pacientes/${params.id}`)
        if (!response.ok) {
          setError('Paciente não encontrado')
          return
        }
        const data = await response.json()
        setPaciente(data)
      } catch {
        setError('Erro ao carregar dados do paciente')
      } finally {
        setLoading(false)
      }
    }

    fetchPaciente()
    fetch(`/api/pacientes/${params.id}/counts`)
      .then((r) => r.ok ? r.json() : {})
      .then(setCounts)
      .catch(() => {})
    fetch(`/api/alertas-clinicos?pacienteId=${params.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setAlertas)
      .catch((err: unknown) => {
        console.error('[prontuario] Erro ao carregar alertas clinicos:', err)
        setAlertas([])
      })
  }, [params.id])

  const gerarAlertas = async () => {
    setGerandoAlertas(true)
    try {
      const r = await fetch('/api/alertas-clinicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId: params.id }),
      })
      if (r.ok) {
        const novos = await r.json()
        setAlertas(novos)
      }
    } finally {
      setGerandoAlertas(false)
    }
  }

  const marcarAlerta = async (id: string, estado: string) => {
    await fetch(`/api/alertas-clinicos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    setAlertas((prev) => prev.map((a) => a.id === id ? { ...a, estado } : a))
  }

  const handleToggleCondicao = async (historicoId: string, statusAtual: string) => {
    const novoStatus = statusAtual === 'ATIVA' ? 'RESOLVIDA' : 'ATIVA'
    try {
      await fetch(`/api/historico-clinico/${historicoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      })
      setPaciente((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          historicoClinico: prev.historicoClinico.map((h) =>
            h.id === historicoId ? { ...h, status: novoStatus } : h
          ),
        }
      })
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !paciente) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error || 'Paciente não encontrado'}</p>
        </div>
        <Link href="/dashboard/pacientes" className="mt-4 inline-block btn-secondary">
          Voltar
        </Link>
      </div>
    )
  }

  const idade = calcularIdade(paciente.dataNascimento)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {paciente.nome} {paciente.sobrenome}
          </h1>
          <p className="text-gray-500 mt-1">
            {formatarCPF(paciente.cpf)} · {idade} anos ·{' '}
            {paciente.genero === 'M' ? 'Masculino' : paciente.genero === 'F' ? 'Feminino' : 'Outro'}
          </p>
          {paciente.unidadeSaude && (
            <p className="text-sm text-gray-500 mt-0.5">{paciente.unidadeSaude}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/pacientes/${paciente.id}/editar`}
            className="btn-secondary flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <Link
            href={`/dashboard/atendimentos/novo?pacienteId=${paciente.id}`}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Atendimento
          </Link>
        </div>
      </div>

      {/* Navegação rápida com contadores */}
      <div className="flex gap-2 flex-wrap">
        {[
          { href: 'exames',      icon: '🧪', label: 'Exames',      count: counts.exames },
          { href: 'medicamentos',icon: '💊', label: 'Medicamentos', count: counts.medicamentos },
          { href: 'prf',         icon: '⚠️', label: 'PRFs',         count: counts.prms,        alert: true },
          { href: 'intervencoes',icon: '🩺', label: 'Intervenções', count: counts.intervencoes },
          { href: 'calendario',  icon: '📅', label: 'Calendário',   count: undefined },
          { href: 'risco',       icon: '🛡️', label: 'Risco',        count: undefined },
          { href: 'plano',       icon: '📋', label: 'Plano',        count: undefined },
          { href: 'evolucao',    icon: '📈', label: 'Evolução',     count: undefined },
          { href: 'anexos',      icon: '📎', label: 'Anexos',       count: counts.anexos },
          { href: 'comunicacao', icon: '✉️', label: 'Comunicação',  count: (counts.cartas ?? 0) + (counts.tarefas ?? 0) || undefined },
          { href: 'historico',   icon: '🕐', label: 'Histórico',    count: undefined },
          { href: 'adesao',      icon: '📋', label: 'Adesão',         count: undefined },
          { href: 'timeline',    icon: '⏱️', label: 'Linha do Tempo', count: undefined },
        ].map(({ href, icon, label, count, alert }) => (
          <Link
            key={href}
            href={`/dashboard/pacientes/${paciente.id}/${href}`}
            className="relative flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-blue-400 transition-colors"
          >
            <span>{icon}</span>
            <span>{label}</span>
            {count !== undefined && count > 0 && (
              <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${alert ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                {count}
              </span>
            )}
          </Link>
        ))}
        <a href={`/api/relatorios/prontuario/${paciente.id}`} target="_blank" className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-blue-400 transition-colors">
          🖨️ Imprimir
        </a>
      </div>

      {/* Alertas Clinicos */}
      {(() => {
        const ativos = alertas.filter((a) => a.estado === 'ATIVO')
        const criticos = ativos.filter((a) => a.severidade === 'CRITICO')
        const atencao = ativos.filter((a) => a.severidade === 'ATENCAO')
        if (ativos.length === 0 && alertas.length === 0) {
          return (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Bell className="h-4 w-4" />
                <span>Sem alertas clinicos ativos</span>
              </div>
              <button
                onClick={gerarAlertas}
                disabled={gerandoAlertas}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
              >
                {gerandoAlertas ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Analisar
              </button>
            </div>
          )
        }
        return (
          <div className={`rounded-lg border p-4 ${criticos.length > 0 ? 'border-red-300 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className={`h-4 w-4 ${criticos.length > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
                <span className={`text-sm font-semibold ${criticos.length > 0 ? 'text-red-700' : 'text-yellow-700'}`}>
                  {ativos.length} Alerta{ativos.length !== 1 ? 's' : ''} Ativo{ativos.length !== 1 ? 's' : ''}
                  {criticos.length > 0 && ` (${criticos.length} critico${criticos.length !== 1 ? 's' : ''})`}
                </span>
              </div>
              <button
                onClick={gerarAlertas}
                disabled={gerandoAlertas}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800"
              >
                {gerandoAlertas ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Reanalisar
              </button>
            </div>
            <div className="space-y-2">
              {[...criticos, ...atencao].slice(0, 3).map((a) => (
                <div key={a.id} className={`rounded-lg border p-3 bg-white flex items-start justify-between gap-3 ${
                  a.severidade === 'CRITICO' ? 'border-red-200' : 'border-yellow-200'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{a.descricao}</p>
                    {a.sugestaoAcao && (
                      <p className="text-xs text-gray-500 mt-0.5">{a.sugestaoAcao}</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => marcarAlerta(a.id, 'VISTO')}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                    >
                      Visto
                    </button>
                    <button
                      onClick={() => marcarAlerta(a.id, 'IGNORADO')}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              ))}
              {ativos.length > 3 && (
                <p className="text-xs text-gray-500 text-center">+ {ativos.length - 3} alertas adicionais</p>
              )}
            </div>
          </div>
        )
      })()}

      <div className="grid grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="col-span-2 space-y-6">
          {/* Atendimentos Recentes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-600" />
                Atendimentos
              </h2>
            </div>

            {paciente.atendimentos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum atendimento registrado</p>
            ) : (
              <div className="space-y-2">
                {paciente.atendimentos.map((at, idx) => {
                  const dentroJanela = idx === 0 && (() => {
                    const expira = new Date(at.criadoEm)
                    expira.setDate(expira.getDate() + 7)
                    return expira > new Date()
                  })()
                  return (
                    <div
                      key={at.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {TIPO_LABELS[at.tipo] || at.tipo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(at.dataAtendimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {dentroJanela && (
                          <Link
                            href={`/dashboard/atendimentos/${at.id}/editar`}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Editar
                          </Link>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            at.status === 'ABERTO'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {at.status === 'ABERTO' ? 'Aberto' : 'Concluído'}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Histórico Clínico */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary-600" />
                Histórico Clínico
              </h2>
            </div>

            {paciente.historicoClinico.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Nenhuma condição registrada
              </p>
            ) : (
              <div className="space-y-2">
                {paciente.historicoClinico.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {h.doenca}
                        {h.cid10 && (
                          <span className="ml-2 text-xs text-gray-400 font-mono">{h.cid10}</span>
                        )}
                      </p>
                      {h.dataDiagnostico && (
                        <p className="text-xs text-gray-500">
                          Diagnóstico: {new Date(h.dataDiagnostico).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleCondicao(h.id, h.status)}
                      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors ${
                        h.status === 'ATIVA'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {h.status === 'ATIVA' ? (
                        <>
                          <Clock className="h-3 w-3" />
                          Ativa
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Resolvida
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dados do Paciente */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Dados do Paciente
            </h2>
            <dl className="space-y-3 text-sm">
              {paciente.telefone && (
                <div>
                  <dt className="text-gray-500">Telefone</dt>
                  <dd className="text-gray-900">{paciente.telefone}</dd>
                </div>
              )}
              {paciente.telefoneSecundario && (
                <div>
                  <dt className="text-gray-500">Tel. Secundário</dt>
                  <dd className="text-gray-900">{paciente.telefoneSecundario}</dd>
                </div>
              )}
              {paciente.email && (
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900 break-all">{paciente.email}</dd>
                </div>
              )}
              {paciente.endereco && (
                <div>
                  <dt className="text-gray-500">Endereço</dt>
                  <dd className="text-gray-900">
                    {paciente.endereco}
                    {paciente.cidade && `, ${paciente.cidade}`}
                    {paciente.estado && ` - ${paciente.estado}`}
                    {paciente.cep && ` (${paciente.cep})`}
                  </dd>
                </div>
              )}
              {paciente.profissionalResponsavel && (
                <div>
                  <dt className="text-gray-500">Profissional</dt>
                  <dd className="text-gray-900">{paciente.profissionalResponsavel}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Notas */}
          {paciente.notas && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Notas
              </h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{paciente.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
