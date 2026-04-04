'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, Printer } from 'lucide-react'

interface MedItem {
  nome: string
  frequencia?: string
  horarios: string[]
}

const HORARIOS_PADRAO = ['Manhã', 'Almoço', 'Tarde', 'Noite', 'Madrugada']
const ICONES: Record<string, string> = { 'Manhã': '🌅', 'Almoço': '☀️', 'Tarde': '🌤️', 'Noite': '🌙', 'Madrugada': '⭐' }

function gerarHorariosDaFrequencia(frequencia?: string): string[] {
  if (!frequencia) return []
  const f = frequencia.toLowerCase()
  if (f.includes('24h') || f.includes('1x') || f.includes('uma vez')) return ['Manhã']
  if (f.includes('12h') || f.includes('2x') || f.includes('duas')) return ['Manhã', 'Noite']
  if (f.includes('8h') || f.includes('3x') || f.includes('três')) return ['Manhã', 'Tarde', 'Noite']
  if (f.includes('6h') || f.includes('4x') || f.includes('quatro')) return ['Manhã', 'Almoço', 'Tarde', 'Noite']
  if (f.includes('continua') || f.includes('infus')) return ['Manhã']
  return ['Manhã']
}

export default function CalendarioPage() {
  const { id: pacienteId } = useParams() as { id: string }
  const [itens, setItens] = useState<MedItem[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [calendarioId, setCalendarioId] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchData() }, [pacienteId])

  const fetchData = async () => {
    setLoading(true)
    const [medRes, calRes] = await Promise.all([
      fetch(`/api/medicamentos-em-uso?pacienteId=${pacienteId}`),
      fetch(`/api/calendario-posologico?pacienteId=${pacienteId}`),
    ])

    if (calRes.ok) {
      const cals = await calRes.json()
      if (cals.length > 0) {
        const ultimo = cals[0]
        setCalendarioId(ultimo.id)
        setItens(ultimo.itens as MedItem[])
        setObservacoes(ultimo.observacoes || '')
        setLoading(false)
        return
      }
    }

    // Gerar automaticamente dos medicamentos em uso
    if (medRes.ok) {
      const meds = await medRes.json()
      const gerados: MedItem[] = (meds as Array<{ nomeCustom?: string; medicamento?: { nome: string }; frequencia?: string }>)
        .filter((m) => m)
        .map((m) => ({
          nome: m.nomeCustom || m.medicamento?.nome || 'Medicamento',
          frequencia: m.frequencia,
          horarios: gerarHorariosDaFrequencia(m.frequencia),
        }))
      setItens(gerados)
    }
    setLoading(false)
  }

  const toggleHorario = (medIndex: number, horario: string) => {
    setItens(prev => prev.map((item, i) => {
      if (i !== medIndex) return item
      const has = item.horarios.includes(horario)
      return { ...item, horarios: has ? item.horarios.filter(h => h !== horario) : [...item.horarios, horario] }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    if (calendarioId) {
      await fetch('/api/calendario-posologico', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: calendarioId, itens, observacoes }),
      })
    } else {
      const res = await fetch('/api/calendario-posologico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId, itens, observacoes }),
      })
      if (res.ok) { const d = await res.json(); setCalendarioId(d.id) }
    }
    setSaving(false)
  }

  const handlePrint = () => window.print()

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 print:hidden">
        <Link href={`/dashboard/pacientes/${pacienteId}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao prontuário
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Calendário Posológico</h1>
          <div className="flex gap-3">
            <button onClick={() => { setCalendarioId(null); fetchData() }} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Regerar
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-secondary flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar
            </button>
            <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </button>
          </div>
        </div>
      </div>

      <div ref={printRef} className="card overflow-x-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center print:block hidden">Calendário Posológico</h2>

        {itens.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum medicamento em uso cadastrado.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 min-w-[180px]">Medicamento</th>
                {HORARIOS_PADRAO.map(h => (
                  <th key={h} className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">
                    {ICONES[h]} {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="border border-gray-200 px-3 py-2">
                    <p className="font-medium text-gray-900">{item.nome}</p>
                    {item.frequencia && <p className="text-xs text-gray-500">{item.frequencia}</p>}
                  </td>
                  {HORARIOS_PADRAO.map(h => (
                    <td key={h} className="border border-gray-200 px-3 py-3 text-center">
                      <button
                        onClick={() => toggleHorario(i, h)}
                        className={`w-8 h-8 rounded-full text-lg transition-all print:hidden ${
                          item.horarios.includes(h)
                            ? 'bg-blue-100 ring-2 ring-blue-400 scale-110'
                            : 'bg-gray-100 opacity-30 hover:opacity-60'
                        }`}
                      >
                        💊
                      </button>
                      <span className="hidden print:block text-xl">
                        {item.horarios.includes(h) ? '💊' : ''}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-4">
          <label className="label-base print:hidden">Observações</label>
          <textarea
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            className="input-base print:hidden"
            rows={2}
            placeholder="Observações gerais sobre o calendário..."
          />
          {observacoes && <p className="mt-2 text-sm text-gray-700 hidden print:block">{observacoes}</p>}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .card, .card * { visibility: visible; }
          .card { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .hidden.print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  )
}
