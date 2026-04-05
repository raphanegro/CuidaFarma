'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface MedicamentoEmUso {
  id: string
  nomeCustom: string | null
  medicamento: { nome: string } | null
}

interface PRF {
  id: string
  categoria: string
  descricao: string
  gravidade: string
  status: string
  criadoEm: string
  medicamentoEmUso: {
    id: string
    nomeCustom: string | null
    medicamento: { nome: string } | null
  } | null
}

const CATEGORIAS: Record<string, string> = {
  NECESSIDADE: 'Necessidade',
  EFETIVIDADE: 'Efetividade',
  SEGURANCA: 'Segurança',
  ADESAO: 'Adesão',
}

const GRAVIDADE_CORES: Record<string, string> = {
  LEVE: 'bg-yellow-100 text-yellow-800',
  MODERADO: 'bg-orange-100 text-orange-800',
  GRAVE: 'bg-red-100 text-red-800',
}

const STATUS_CORES: Record<string, string> = {
  IDENTIFICADO: 'bg-blue-100 text-blue-800',
  EM_ACOMPANHAMENTO: 'bg-purple-100 text-purple-800',
  RESOLVIDO: 'bg-green-100 text-green-800',
}

const STATUS_LABELS: Record<string, string> = {
  IDENTIFICADO: 'Identificado',
  EM_ACOMPANHAMENTO: 'Em Acompanhamento',
  RESOLVIDO: 'Resolvido',
}

export default function PRFPage() {
  const { id: pacienteId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const atendimentoId = searchParams.get('atendimentoId')

  const [prfs, setPrfs] = useState<PRF[]>([])
  const [medicamentosEmUso, setMedicamentosEmUso] = useState<MedicamentoEmUso[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('')

  const [form, setForm] = useState({
    atendimentoId: atendimentoId ?? '',
    categoria: 'NECESSIDADE',
    descricao: '',
    medicamentoEmUsoId: '',
    gravidade: 'MODERADO',
  })

  const buscarPRFs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pacienteId })
    if (filtroStatus) params.set('status', filtroStatus)
    const res = await fetch(`/api/prf?${params}`)
    if (res.ok) setPrfs(await res.json())
    setLoading(false)
  }, [pacienteId, filtroStatus])

  useEffect(() => {
    buscarPRFs()
  }, [buscarPRFs])

  useEffect(() => {
    fetch(`/api/medicamentos-em-uso?pacienteId=${pacienteId}&status=EM_USO`)
      .then((r) => r.json())
      .then(setMedicamentosEmUso)
  }, [pacienteId])

  async function salvarPRF(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/prf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pacienteId,
        atendimentoId: form.atendimentoId,
        categoria: form.categoria,
        descricao: form.descricao,
        gravidade: form.gravidade,
        medicamentoEmUsoId: form.medicamentoEmUsoId || undefined,
      }),
    })
    if (res.ok) {
      setMostrarForm(false)
      setForm({ ...form, descricao: '', medicamentoEmUsoId: '' })
      buscarPRFs()
    }
  }

  async function alterarStatus(id: string, status: string) {
    await fetch(`/api/prf/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    buscarPRFs()
  }

  const nomeMed = (m: { nomeCustom: string | null; medicamento: { nome: string } | null } | null) =>
    m?.medicamento?.nome ?? m?.nomeCustom ?? null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/dashboard/pacientes/${pacienteId}`} className="text-sm text-blue-600 hover:underline">
            ← Voltar ao Prontuário
          </Link>
          <h1 className="text-2xl font-bold mt-1">Problemas Relacionados à Farmacoterapia</h1>
        </div>
        {atendimentoId && (
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {mostrarForm ? 'Cancelar' : '+ Registrar PRF'}
          </button>
        )}
      </div>

      {!atendimentoId && (
        <p className="text-sm text-gray-500 mb-4">
          Para registrar um PRF, acesse esta página a partir de um atendimento.
        </p>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {['', 'IDENTIFICADO', 'EM_ACOMPANHAMENTO', 'RESOLVIDO'].map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-3 py-1 rounded-full text-sm border ${filtroStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600'}`}
          >
            {s ? STATUS_LABELS[s] : 'Todos'}
          </button>
        ))}
      </div>

      {/* Formulário */}
      {mostrarForm && atendimentoId && (
        <form onSubmit={salvarPRF} className="bg-gray-50 border rounded-lg p-4 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-800">Registrar Novo PRF</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" required>
                {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gravidade *</label>
              <select value={form.gravidade} onChange={(e) => setForm({ ...form, gravidade: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" required>
                <option value="LEVE">Leve</option>
                <option value="MODERADO">Moderado</option>
                <option value="GRAVE">Grave</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicamento Relacionado (opcional)</label>
              <select value={form.medicamentoEmUsoId} onChange={(e) => setForm({ ...form, medicamentoEmUsoId: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                <option value="">Nenhum</option>
                {medicamentosEmUso.map((m) => (
                  <option key={m.id} value={m.id}>{m.medicamento?.nome ?? m.nomeCustom}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada *</label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            Salvar PRF
          </button>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : prfs.length === 0 ? (
        <p className="text-gray-500">Nenhum PRF registrado.</p>
      ) : (
        <div className="space-y-3">
          {prfs.map((prf) => (
            <div key={prf.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{CATEGORIAS[prf.categoria]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GRAVIDADE_CORES[prf.gravidade]}`}>
                      {prf.gravidade.charAt(0) + prf.gravidade.slice(1).toLowerCase()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[prf.status]}`}>
                      {STATUS_LABELS[prf.status]}
                    </span>
                  </div>
                  {nomeMed(prf.medicamentoEmUso) && (
                    <p className="text-xs text-gray-500 mb-1">Medicamento: {nomeMed(prf.medicamentoEmUso)}</p>
                  )}
                  <p className="text-sm text-gray-700">{prf.descricao}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Registrado em {new Date(prf.criadoEm).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {prf.status === 'IDENTIFICADO' && (
                    <button onClick={() => alterarStatus(prf.id, 'EM_ACOMPANHAMENTO')} className="text-xs text-purple-600 hover:underline">Acompanhar</button>
                  )}
                  {prf.status === 'EM_ACOMPANHAMENTO' && (
                    <button onClick={() => alterarStatus(prf.id, 'RESOLVIDO')} className="text-xs text-green-600 hover:underline">Resolver</button>
                  )}
                  {prf.status === 'RESOLVIDO' && (
                    <button onClick={() => alterarStatus(prf.id, 'IDENTIFICADO')} className="text-xs text-gray-500 hover:underline">Reabrir</button>
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
