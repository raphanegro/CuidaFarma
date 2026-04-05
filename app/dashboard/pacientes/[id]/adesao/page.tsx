'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Visita {
  id: string
  data: string
  tipo: string
}

interface Medicamento {
  id: string
  nome: string
  dose?: string | null
  frequencia?: string | null
}

interface AvaliacaoVisita {
  taxa: number
  classificacao: string
  qtdEsperada: number
  qtdContada: number
  observacao?: string | null
}

interface HistoricoAdesao {
  visitas: Visita[]
  medicamentos: Medicamento[]
  matriz: Record<string, Record<string, AvaliacaoVisita>>
  tendencias: Record<string, 'melhora' | 'piora' | 'estavel' | null>
}

const TIPO_LABEL: Record<string, string> = {
  CONSULTA_UBS: 'UBS',
  CONSULTORIO_FARMACEUTICO: 'Consultório',
  VISITA_DOMICILIAR: 'Domiciliar',
  TELEATENDIMENTO: 'Teleatend.',
}

const CLASS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  BOA:     { label: 'Boa',     bg: 'bg-green-100',  text: 'text-green-800' },
  PARCIAL: { label: 'Parcial', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  BAIXA:   { label: 'Baixa',  bg: 'bg-red-100',    text: 'text-red-800' },
}

const TENDENCIA_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  melhora: { icon: '↑', label: 'Melhora', color: 'text-green-600' },
  piora:   { icon: '↓', label: 'Piora',   color: 'text-red-600'   },
  estavel: { icon: '→', label: 'Estável', color: 'text-gray-500'  },
}

export default function AdesaoPage() {
  const { id: pacienteId } = useParams<{ id: string }>()
  const [dados, setDados] = useState<HistoricoAdesao | null>(null)
  const [loading, setLoading] = useState(true)
  const [medSelecionado, setMedSelecionado] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/avaliacao-adesao/historico?pacienteId=${pacienteId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        setDados(d)
        if (d?.medicamentos?.length > 0) setMedSelecionado(d.medicamentos[0].id)
      })
      .finally(() => setLoading(false))
  }, [pacienteId])

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  const semDados = !dados || dados.visitas.length === 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <Link href={`/dashboard/pacientes/${pacienteId}`} className="text-sm text-blue-600 hover:underline">
          ← Voltar ao Prontuário
        </Link>
        <h1 className="text-2xl font-bold mt-1">Histórico de Adesão</h1>
        <p className="text-sm text-gray-500 mt-1">
          Contagem de medicamentos por visita e evolução da adesão ao tratamento
        </p>
      </div>

      {semDados ? (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          <p className="text-4xl mb-3">💊</p>
          <p className="font-medium text-gray-700">Nenhuma avaliação de adesão registrada</p>
          <p className="text-sm mt-1">
            Realize a contagem de medicamentos durante um atendimento para visualizar o histórico.
          </p>
          <Link
            href={`/dashboard/atendimentos/novo?pacienteId=${pacienteId}`}
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Novo Atendimento
          </Link>
        </div>
      ) : (
        <>
          {/* Resumo por medicamento com tendência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dados.medicamentos.map((med) => {
              const tendencia = dados.tendencias[med.id]
              const tc = tendencia ? TENDENCIA_CONFIG[tendencia] : null
              // Última avaliação deste medicamento
              const ultimaVisita = [...dados.visitas].reverse().find((v) => dados.matriz[med.id]?.[v.id])
              const ultima = ultimaVisita ? dados.matriz[med.id][ultimaVisita.id] : null
              const cc = ultima ? CLASS_CONFIG[ultima.classificacao] : null
              const ativo = medSelecionado === med.id
              return (
                <button
                  key={med.id}
                  onClick={() => setMedSelecionado(ativo ? null : med.id)}
                  className={`text-left border rounded-lg p-4 transition-colors ${
                    ativo ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{med.nome}</p>
                      {(med.dose || med.frequencia) && (
                        <p className="text-xs text-gray-400 truncate">{[med.dose, med.frequencia].filter(Boolean).join(' · ')}</p>
                      )}
                    </div>
                    {tc && (
                      <span className={`text-sm font-bold flex-shrink-0 ${tc.color}`} title={tc.label}>
                        {tc.icon}
                      </span>
                    )}
                  </div>
                  {ultima && cc && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cc.bg} ${cc.text}`}>
                        {cc.label}
                      </span>
                      <span className="text-xs text-gray-500">{ultima.taxa}%</span>
                    </div>
                  )}
                  {!ultima && (
                    <p className="mt-2 text-xs text-gray-400">Sem avaliações ainda</p>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tabela matriz: visitas × avaliação do medicamento selecionado */}
          {medSelecionado && dados.medicamentos.find((m) => m.id === medSelecionado) && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h2 className="font-semibold text-gray-700 text-sm">
                  {dados.medicamentos.find((m) => m.id === medSelecionado)?.nome} — Histórico por Visita
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-500 text-xs">
                      <th className="text-left px-4 py-2 font-medium">Visita</th>
                      <th className="text-left px-4 py-2 font-medium">Tipo</th>
                      <th className="text-center px-4 py-2 font-medium">Qtd Esperada</th>
                      <th className="text-center px-4 py-2 font-medium">Qtd Contada</th>
                      <th className="text-center px-4 py-2 font-medium">Taxa</th>
                      <th className="text-center px-4 py-2 font-medium">Classificação</th>
                      <th className="text-left px-4 py-2 font-medium">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.visitas.map((visita, idx) => {
                      const av = dados.matriz[medSelecionado]?.[visita.id]
                      const cc = av ? CLASS_CONFIG[av.classificacao] : null
                      // Calcula diff em relação à visita anterior com dados
                      let diff: number | null = null
                      if (av) {
                        const anterioresComDados = dados.visitas
                          .slice(0, idx)
                          .filter((v) => dados.matriz[medSelecionado]?.[v.id])
                        if (anterioresComDados.length > 0) {
                          const antId = anterioresComDados[anterioresComDados.length - 1].id
                          diff = av.taxa - dados.matriz[medSelecionado][antId].taxa
                        }
                      }
                      return (
                        <tr key={visita.id} className={`border-t ${!av ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 text-gray-700">
                            {new Date(visita.data).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {TIPO_LABEL[visita.tipo] ?? visita.tipo}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {av ? av.qtdEsperada : '—'}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {av ? av.qtdContada : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {av ? (
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-semibold">{av.taxa}%</span>
                                {diff !== null && (
                                  <span className={`text-xs ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {diff > 0 ? `+${diff.toFixed(0)}` : diff.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {av && cc ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cc.bg} ${cc.text}`}>
                                {cc.label}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                            {av?.observacao ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela geral: todos os medicamentos × todas as visitas */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h2 className="font-semibold text-gray-700 text-sm">Matriz Geral de Adesão</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-500">
                    <th className="text-left px-4 py-2 font-medium min-w-[160px]">Medicamento</th>
                    {dados.visitas.map((v) => (
                      <th key={v.id} className="text-center px-3 py-2 font-medium min-w-[80px]">
                        {new Date(v.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </th>
                    ))}
                    <th className="text-center px-3 py-2 font-medium">Tendência</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.medicamentos.map((med) => {
                    const tc = dados.tendencias[med.id] ? TENDENCIA_CONFIG[dados.tendencias[med.id]!] : null
                    return (
                      <tr key={med.id} className="border-t">
                        <td className="px-4 py-2">
                          <p className="font-medium text-gray-800 truncate max-w-[150px]">{med.nome}</p>
                          {med.dose && <p className="text-gray-400 text-[10px]">{med.dose}</p>}
                        </td>
                        {dados.visitas.map((v) => {
                          const av = dados.matriz[med.id]?.[v.id]
                          const cc = av ? CLASS_CONFIG[av.classificacao] : null
                          return (
                            <td key={v.id} className="px-3 py-2 text-center">
                              {av && cc ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cc.bg} ${cc.text}`}>
                                    {av.taxa}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-center">
                          {tc ? (
                            <span className={`font-bold text-base ${tc.color}`} title={tc.label}>
                              {tc.icon}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
