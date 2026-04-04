'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Exame {
  id: string
  tipo: string
  tipoCustom: string | null
  valor: number
  unidade: string
  dataColeta: string
  laboratorio: string | null
  refMin: number | null
  refMax: number | null
}

const TIPOS_EXAME: Record<string, string> = {
  GLICEMIA_JEJUM: 'Glicemia de Jejum',
  HEMOGLOBINA_GLICADA: 'Hemoglobina Glicada (HbA1c)',
  COLESTEROL_TOTAL: 'Colesterol Total',
  LDL: 'LDL',
  HDL: 'HDL',
  TRIGLICERIDEOS: 'Triglicerídeos',
  CREATININA: 'Creatinina',
  TFG: 'Taxa de Filtração Glomerular (TFG)',
  OUTRO: 'Outro',
}

const REFERENCIAS_PADRAO: Record<string, { min?: number; max?: number; unidade: string }> = {
  GLICEMIA_JEJUM: { max: 99, unidade: 'mg/dL' },
  HEMOGLOBINA_GLICADA: { max: 5.7, unidade: '%' },
  COLESTEROL_TOTAL: { max: 200, unidade: 'mg/dL' },
  LDL: { max: 130, unidade: 'mg/dL' },
  HDL: { min: 40, unidade: 'mg/dL' },
  TRIGLICERIDEOS: { max: 150, unidade: 'mg/dL' },
  CREATININA: { min: 0.6, max: 1.2, unidade: 'mg/dL' },
  TFG: { min: 60, unidade: 'mL/min/1.73m²' },
}

function isForaDaFaixa(exame: Exame): boolean {
  const refPadrao = REFERENCIAS_PADRAO[exame.tipo]
  const refMin = exame.refMin ?? refPadrao?.min
  const refMax = exame.refMax ?? refPadrao?.max
  if (refMin !== undefined && Number(exame.valor) < refMin) return true
  if (refMax !== undefined && Number(exame.valor) > refMax) return true
  return false
}

export default function ExamesPage() {
  const { id: pacienteId } = useParams<{ id: string }>()
  const [exames, setExames] = useState<Exame[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [tipoFiltro, setTipoFiltro] = useState('')

  const [form, setForm] = useState({
    tipo: 'GLICEMIA_JEJUM',
    tipoCustom: '',
    valor: '',
    unidade: '',
    dataColeta: new Date().toISOString().split('T')[0],
    laboratorio: '',
    refMin: '',
    refMax: '',
  })

  const buscarExames = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pacienteId })
    if (tipoFiltro) params.set('tipo', tipoFiltro)
    const res = await fetch(`/api/exames?${params}`)
    if (res.ok) setExames(await res.json())
    setLoading(false)
  }, [pacienteId, tipoFiltro])

  useEffect(() => {
    buscarExames()
  }, [buscarExames])

  // Pré-preenche unidade ao trocar tipo
  useEffect(() => {
    const ref = REFERENCIAS_PADRAO[form.tipo]
    if (ref) setForm((f) => ({ ...f, unidade: ref.unidade }))
  }, [form.tipo])

  async function salvarExame(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/exames', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pacienteId,
        tipo: form.tipo,
        tipoCustom: form.tipo === 'OUTRO' ? form.tipoCustom : undefined,
        valor: Number(form.valor),
        unidade: form.unidade,
        dataColeta: form.dataColeta,
        laboratorio: form.laboratorio || undefined,
        refMin: form.refMin ? Number(form.refMin) : undefined,
        refMax: form.refMax ? Number(form.refMax) : undefined,
      }),
    })
    if (res.ok) {
      setMostrarForm(false)
      setForm({
        tipo: 'GLICEMIA_JEJUM',
        tipoCustom: '',
        valor: '',
        unidade: '',
        dataColeta: new Date().toISOString().split('T')[0],
        laboratorio: '',
        refMin: '',
        refMax: '',
      })
      buscarExames()
    }
  }

  async function excluirExame(id: string) {
    if (!confirm('Excluir este exame?')) return
    await fetch(`/api/exames/${id}`, { method: 'DELETE' })
    buscarExames()
  }

  const examesPorTipo = TIPOS_EXAME
  const tiposPresentes = [...new Set(exames.map((e) => e.tipo))]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/dashboard/pacientes/${pacienteId}`} className="text-sm text-blue-600 hover:underline">
            ← Voltar ao Prontuário
          </Link>
          <h1 className="text-2xl font-bold mt-1">Exames Laboratoriais</h1>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Novo Exame'}
        </button>
      </div>

      {/* Filtro por tipo */}
      <div className="mb-4">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(examesPorTipo).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Formulário de novo exame */}
      {mostrarForm && (
        <form onSubmit={salvarExame} className="bg-gray-50 border rounded-lg p-4 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-800">Registrar Novo Exame</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Exame *</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              >
                {Object.entries(examesPorTipo).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            {form.tipo === 'OUTRO' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Exame *</label>
                <input
                  type="text"
                  value={form.tipoCustom}
                  onChange={(e) => setForm({ ...form, tipoCustom: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
              <input
                type="number"
                step="0.01"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
              <input
                type="text"
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Coleta *</label>
              <input
                type="date"
                value={form.dataColeta}
                onChange={(e) => setForm({ ...form, dataColeta: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Laboratório</label>
              <input
                type="text"
                value={form.laboratorio}
                onChange={(e) => setForm({ ...form, laboratorio: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ref. Mínimo</label>
              <input
                type="number"
                step="0.01"
                value={form.refMin}
                onChange={(e) => setForm({ ...form, refMin: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ref. Máximo</label>
              <input
                type="number"
                step="0.01"
                value={form.refMax}
                onChange={(e) => setForm({ ...form, refMax: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            Salvar Exame
          </button>
        </form>
      )}

      {/* Lista de exames agrupada por tipo */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : exames.length === 0 ? (
        <p className="text-gray-500">Nenhum exame registrado.</p>
      ) : (
        <div className="space-y-4">
          {tiposPresentes.map((tipo) => {
            const examesDotipo = exames.filter((e) => e.tipo === tipo)
            return (
              <div key={tipo} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-medium text-sm text-gray-700">
                  {TIPOS_EXAME[tipo] ?? tipo}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="text-left px-4 py-2">Valor</th>
                      <th className="text-left px-4 py-2">Referência</th>
                      <th className="text-left px-4 py-2">Data</th>
                      <th className="text-left px-4 py-2">Laboratório</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {examesDotipo.map((exame) => {
                      const alerta = isForaDaFaixa(exame)
                      const refPadrao = REFERENCIAS_PADRAO[exame.tipo]
                      const refMin = exame.refMin ?? refPadrao?.min
                      const refMax = exame.refMax ?? refPadrao?.max
                      const refTexto = refMin !== undefined && refMax !== undefined
                        ? `${refMin} – ${refMax}`
                        : refMin !== undefined ? `≥ ${refMin}` : refMax !== undefined ? `≤ ${refMax}` : '—'
                      return (
                        <tr key={exame.id} className="border-t">
                          <td className="px-4 py-2">
                            <span className={alerta ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                              {Number(exame.valor).toLocaleString('pt-BR')} {exame.unidade}
                            </span>
                            {alerta && (
                              <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                ⚠ Fora da faixa
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-600">{refTexto}</td>
                          <td className="px-4 py-2 text-gray-600">
                            {new Date(exame.dataColeta).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-2 text-gray-600">{exame.laboratorio ?? '—'}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => excluirExame(exame.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
