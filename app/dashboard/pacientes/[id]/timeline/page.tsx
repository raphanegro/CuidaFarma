'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Evento {
  id: string
  data: string
  tipo: string
  categoria: string
  descricao: string
  detalhe?: string
  cor: string
}

const COR_MAP: Record<string, string> = {
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  red:    'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  purple: 'bg-purple-500',
  gray:   'bg-gray-400',
  teal:   'bg-teal-500',
}

const BADGE_MAP: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray:   'bg-gray-50 text-gray-600 border-gray-200',
  teal:   'bg-teal-50 text-teal-700 border-teal-200',
}

const ICONE: Record<string, string> = {
  atendimento: '🏥',
  exame:       '🧪',
  medicamento: '💊',
  prf:         '⚠️',
  intervencao: '🩺',
  alerta:      '🔔',
  risco:       '🛡️',
  evolucao:    '📈',
}

const CATEGORIAS = ['Todos', 'Atendimento', 'Exame', 'Medicamento', 'PRF', 'Intervenção', 'Alerta', 'Risco', 'Evolução']

export default function TimelinePage() {
  const { id: pacienteId } = useParams<{ id: string }>()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('Todos')

  useEffect(() => {
    fetch(`/api/pacientes/${pacienteId}/timeline`)
      .then((r) => r.ok ? r.json() : [])
      .then(setEventos)
      .finally(() => setLoading(false))
  }, [pacienteId])

  const filtrados = filtro === 'Todos' ? eventos : eventos.filter((e) => e.categoria === filtro)

  // Agrupar por mês
  const grupos: Record<string, Evento[]> = {}
  for (const e of filtrados) {
    const chave = new Date(e.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    if (!grupos[chave]) grupos[chave] = []
    grupos[chave].push(e)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/pacientes/${pacienteId}`} className="text-sm text-blue-600 hover:underline">
          ← Voltar ao Prontuário
        </Link>
        <h1 className="text-2xl font-bold mt-1">Linha do Tempo Clínica</h1>
        <p className="text-sm text-gray-500 mt-1">Histórico cronológico de todos os eventos clínicos</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtro === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat}
            {cat !== 'Todos' && (
              <span className="ml-1 opacity-60">
                ({eventos.filter((e) => e.categoria === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Carregando...</p>}

      {!loading && filtrados.length === 0 && (
        <p className="text-gray-500">Nenhum evento registrado.</p>
      )}

      {/* Timeline agrupada por mês */}
      <div className="space-y-8">
        {Object.entries(grupos).map(([mes, evs]) => (
          <div key={mes}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 capitalize">
              {mes}
            </h2>
            <div className="relative">
              {/* Linha vertical */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-4">
                {evs.map((evento) => (
                  <div key={`${evento.tipo}-${evento.id}`} className="relative flex gap-4 pl-10">
                    {/* Ponto na linha */}
                    <div className={`absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-white ${COR_MAP[evento.cor] ?? 'bg-gray-400'}`} />
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{ICONE[evento.tipo] ?? '📌'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BADGE_MAP[evento.cor] ?? BADGE_MAP.gray}`}>
                            {evento.categoria}
                          </span>
                        </div>
                        <time className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(evento.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </time>
                      </div>
                      <p className="mt-1.5 text-sm text-gray-800">{evento.descricao}</p>
                      {evento.detalhe && (
                        <p className="mt-0.5 text-xs text-gray-500">{evento.detalhe}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
