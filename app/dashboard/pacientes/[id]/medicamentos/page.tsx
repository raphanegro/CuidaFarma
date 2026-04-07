'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Medicamento {
  id: string
  nome: string
  principioAtivo: string
}

interface MedicamentoEmUso {
  id: string
  nomeCustom: string | null
  medicamento: { id: string; nome: string; principioAtivo: string } | null
  dose: string | null
  formaFarmaceutica: string | null
  viaAdministracao: string | null
  frequencia: string | null
  quantidadePorDose: number
  indicacao: string | null
  origem: string
  dataInicio: string
  dataTermino: string | null
  status: string
}

const ORIGENS: Record<string, string> = {
  PRESCRICAO_MEDICA: 'Prescrição Médica',
  AUTOMEDICACAO: 'Automedicação',
  FITOTERAPICO: 'Fitoterápico',
  SUPLEMENTO: 'Suplemento',
}

const STATUS_CORES: Record<string, string> = {
  EM_USO: 'bg-green-100 text-green-800',
  DESCONTINUADO: 'bg-gray-100 text-gray-600',
  SUSPENSO: 'bg-yellow-100 text-yellow-800',
}

const STATUS_LABELS: Record<string, string> = {
  EM_USO: 'Em Uso',
  DESCONTINUADO: 'Descontinuado',
  SUSPENSO: 'Suspenso',
}

export default function MedicamentosPage() {
  const { id: pacienteId } = useParams<{ id: string }>()
  const [medicamentos, setMedicamentos] = useState<MedicamentoEmUso[]>([])
  const [catalogo, setCatalogo] = useState<Medicamento[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('EM_USO')
  const [buscaCatalogo, setBuscaCatalogo] = useState('')

  const [form, setForm] = useState({
    medicamentoId: '',
    nomeCustom: '',
    dose: '',
    formaFarmaceutica: '',
    viaAdministracao: '',
    frequencia: '',
    quantidadePorDose: '1',
    indicacao: '',
    origem: 'PRESCRICAO_MEDICA',
    dataInicio: new Date().toISOString().split('T')[0],
    dataTermino: '',
    status: 'EM_USO',
  })

  const buscarMedicamentos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pacienteId })
    if (filtroStatus) params.set('status', filtroStatus)
    const res = await fetch(`/api/medicamentos-em-uso?${params}`)
    if (res.ok) setMedicamentos(await res.json())
    setLoading(false)
  }, [pacienteId, filtroStatus])

  useEffect(() => {
    buscarMedicamentos()
  }, [buscarMedicamentos])

  // Busca catálogo com debounce
  useEffect(() => {
    if (!buscaCatalogo) { setCatalogo([]); return }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/medicamentos?search=${encodeURIComponent(buscaCatalogo)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setCatalogo(data.medicamentos ?? data)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [buscaCatalogo])

  async function salvarMedicamento(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/medicamentos-em-uso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pacienteId,
        medicamentoId: form.medicamentoId || undefined,
        nomeCustom: !form.medicamentoId ? form.nomeCustom : undefined,
        dose: form.dose || undefined,
        formaFarmaceutica: form.formaFarmaceutica || undefined,
        viaAdministracao: form.viaAdministracao || undefined,
        frequencia: form.frequencia || undefined,
        quantidadePorDose: Number(form.quantidadePorDose),
        indicacao: form.indicacao || undefined,
        origem: form.origem,
        dataInicio: form.dataInicio,
        dataTermino: form.dataTermino || undefined,
        status: form.status,
      }),
    })
    if (res.ok) {
      setMostrarForm(false)
      buscarMedicamentos()
    }
  }

  async function alterarStatus(id: string, status: string) {
    await fetch(`/api/medicamentos-em-uso/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    buscarMedicamentos()
  }

  const nomeMedicamento = (m: MedicamentoEmUso) =>
    m.medicamento?.nome ?? m.nomeCustom ?? 'Sem nome'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/dashboard/pacientes/${pacienteId}`} className="text-sm text-blue-600 hover:underline">
            ← Voltar ao Prontuário
          </Link>
          <h1 className="text-2xl font-bold mt-1">Medicamentos em Uso</h1>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Adicionar Medicamento'}
        </button>
      </div>

      {/* Filtro de status */}
      <div className="flex gap-2 mb-4">
        {['EM_USO', 'SUSPENSO', 'DESCONTINUADO', ''].map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-3 py-1 rounded-full text-sm border ${filtroStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600'}`}
          >
            {s ? STATUS_LABELS[s] : 'Todos'}
          </button>
        ))}
      </div>

      {/* Formulário de novo medicamento */}
      {mostrarForm && (
        <form onSubmit={salvarMedicamento} className="bg-gray-50 border rounded-lg p-4 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-800">Adicionar Medicamento</h2>

          {/* Busca no catálogo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar no catálogo (ou preencha o nome abaixo)
            </label>
            <input
              type="text"
              placeholder="Digite o nome do medicamento..."
              value={buscaCatalogo}
              onChange={(e) => { setBuscaCatalogo(e.target.value); setForm({ ...form, medicamentoId: '' }) }}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            {catalogo.length > 0 && (
              <div className="border rounded mt-1 bg-white shadow-sm max-h-40 overflow-y-auto">
                {catalogo.map((med) => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, medicamentoId: med.id, nomeCustom: '' })
                      setBuscaCatalogo(med.nome)
                      setCatalogo([])
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0"
                  >
                    <span className="font-medium">{med.nome}</span>
                    <span className="text-gray-500 ml-2 text-xs">{med.principioAtivo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!form.medicamentoId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Medicamento (texto livre) *</label>
              <input
                type="text"
                value={form.nomeCustom}
                onChange={(e) => setForm({ ...form, nomeCustom: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required={!form.medicamentoId}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dose</label>
              <input type="text" placeholder="ex: 500mg" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qtd por Dose</label>
              <input type="number" min="1" value={form.quantidadePorDose} onChange={(e) => setForm({ ...form, quantidadePorDose: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma Farmacêutica</label>
              <input type="text" placeholder="ex: Comprimido" value={form.formaFarmaceutica} onChange={(e) => setForm({ ...form, formaFarmaceutica: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Via de Administração</label>
              <input type="text" placeholder="ex: Oral" value={form.viaAdministracao} onChange={(e) => setForm({ ...form, viaAdministracao: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
              <input type="text" placeholder="ex: 2x ao dia" value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Indicação</label>
              <input type="text" placeholder="Doença ou condição tratada" value={form.indicacao} onChange={(e) => setForm({ ...form, indicacao: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origem *</label>
              <select value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" required>
                {Object.entries(ORIGENS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início *</label>
              <input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" required />
            </div>
          </div>

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            Salvar Medicamento
          </button>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : medicamentos.length === 0 ? (
        <p className="text-gray-500">Nenhum medicamento encontrado.</p>
      ) : (
        <div className="space-y-3">
          {medicamentos.map((med) => (
            <div key={med.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{nomeMedicamento(med)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[med.status]}`}>
                      {STATUS_LABELS[med.status]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                    {med.dose && <span>{med.dose}</span>}
                    {med.formaFarmaceutica && <span> · {med.formaFarmaceutica}</span>}
                    {med.frequencia && <span> · {med.frequencia}</span>}
                    {med.quantidadePorDose > 1 && <span> · {med.quantidadePorDose} comp/dose</span>}
                  </div>
                  {med.indicacao && <p className="text-xs text-gray-500 mt-1">Indicação: {med.indicacao}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {ORIGENS[med.origem]} · Início: {new Date(med.dataInicio).toLocaleDateString('pt-BR')}
                    {med.dataTermino && ` · Término: ${new Date(med.dataTermino).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {med.status === 'EM_USO' && (
                    <>
                      <button onClick={() => alterarStatus(med.id, 'SUSPENSO')} className="text-xs text-yellow-600 hover:underline">Suspender</button>
                      <button onClick={() => alterarStatus(med.id, 'DESCONTINUADO')} className="text-xs text-gray-500 hover:underline">Descontinuar</button>
                    </>
                  )}
                  {med.status !== 'EM_USO' && (
                    <button onClick={() => alterarStatus(med.id, 'EM_USO')} className="text-xs text-green-600 hover:underline">Reativar</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
