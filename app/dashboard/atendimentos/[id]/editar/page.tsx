'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const TIPOS_ATENDIMENTO = [
  { value: 'CONSULTA_UBS', label: 'Consulta na UBS' },
  { value: 'CONSULTORIO_FARMACEUTICO', label: 'Consultório Farmacêutico' },
  { value: 'VISITA_DOMICILIAR', label: 'Visita Domiciliar' },
  { value: 'TELEATENDIMENTO', label: 'Teleatendimento' },
]

const MOTIVOS_CONSULTA = [
  { value: 'INICIO_TRATAMENTO', label: 'Início de Tratamento' },
  { value: 'REVISAO_MEDICAMENTOS', label: 'Revisão de Medicamentos' },
  { value: 'EFEITO_ADVERSO', label: 'Efeito Adverso' },
  { value: 'MONITORAMENTO', label: 'Monitoramento' },
  { value: 'ADESAO', label: 'Adesão ao Tratamento' },
  { value: 'RETORNO', label: 'Retorno' },
  { value: 'OUTROS', label: 'Outros' },
]

function calcularIMC(peso: string, altura: string) {
  const p = parseFloat(peso), a = parseFloat(altura)
  if (!p || !a || a === 0) return null
  const imc = p / (a * a)
  let classe = ''
  if (imc < 18.5) classe = 'Abaixo do peso'
  else if (imc < 25) classe = 'Normal'
  else if (imc < 30) classe = 'Sobrepeso'
  else if (imc < 35) classe = 'Obesidade I'
  else if (imc < 40) classe = 'Obesidade II'
  else classe = 'Obesidade III'
  return { valor: imc.toFixed(1), classe }
}

function diasRestantes(criadoEm: string): number {
  const criado = new Date(criadoEm)
  const expira = new Date(criado)
  expira.setDate(expira.getDate() + 7)
  return Math.max(0, Math.ceil((expira.getTime() - Date.now()) / 86400000))
}

export default function EditarAtendimentoPage() {
  const { id: atendimentoId } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [pacienteId, setPacienteId] = useState('')
  const [criadoEm, setCriadoEm] = useState('')

  // Seção 1 — Consulta
  const [consulta, setConsulta] = useState({
    tipo: '',
    dataAtendimento: '',
    enderecoVisita: '',
    motivoConsulta: [] as string[],
    motivoDescricao: '',
  })

  // Seção 2 — Sinais Vitais
  const [sinais, setSinais] = useState({
    peso: '', altura: '', paSistolica: '', paDiastolica: '', freqCardiaca: '', glicemiaCapilar: '',
  })

  // Seção 3 — Evolução
  const [evolucao, setEvolucao] = useState({
    adesao: '' as '' | 'BOA' | 'REGULAR' | 'BAIXA',
    adesaoObs: '',
    evolucaoTexto: '',
  })

  useEffect(() => {
    fetch(`/api/atendimentos/${atendimentoId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) { setError('Atendimento não encontrado.'); setLoading(false); return }
        setPacienteId(data.pacienteId)
        setCriadoEm(data.criadoEm)
        setConsulta({
          tipo: data.tipo ?? '',
          dataAtendimento: data.dataAtendimento ? new Date(data.dataAtendimento).toISOString().split('T')[0] : '',
          enderecoVisita: data.enderecoVisita ?? '',
          motivoConsulta: data.motivoConsulta ?? [],
          motivoDescricao: data.motivoDescricao ?? '',
        })
        if (data.dadosClinicos) {
          const d = data.dadosClinicos
          setSinais({
            peso: d.peso != null ? String(d.peso) : '',
            altura: d.altura != null ? String(d.altura) : '',
            paSistolica: d.paSistolica != null ? String(d.paSistolica) : '',
            paDiastolica: d.paDiastolica != null ? String(d.paDiastolica) : '',
            freqCardiaca: d.freqCardiaca != null ? String(d.freqCardiaca) : '',
            glicemiaCapilar: d.glicemiaCapilar != null ? String(d.glicemiaCapilar) : '',
          })
        }
        if (data.evolucaoClinica) {
          const e = data.evolucaoClinica
          setEvolucao({
            adesao: (e.adesao as '' | 'BOA' | 'REGULAR' | 'BAIXA') ?? '',
            adesaoObs: e.adesaoObs ?? '',
            evolucaoTexto: e.evolucaoTexto ?? '',
          })
        }
        setLoading(false)
      })
      .catch(() => { setError('Erro ao carregar atendimento.'); setLoading(false) })
  }, [atendimentoId])

  const toggleMotivo = (v: string) => {
    setConsulta((c) => ({
      ...c,
      motivoConsulta: c.motivoConsulta.includes(v)
        ? c.motivoConsulta.filter((m) => m !== v)
        : [...c.motivoConsulta, v],
    }))
  }

  const imc = calcularIMC(sinais.peso, sinais.altura)
  const dias = criadoEm ? diasRestantes(criadoEm) : 0

  async function salvar() {
    setError('')
    setSaving(true)
    try {
      // 1. Atualiza dados da consulta
      const r1 = await fetch(`/api/atendimentos/${atendimentoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: consulta.tipo,
          dataAtendimento: consulta.dataAtendimento,
          enderecoVisita: consulta.tipo === 'VISITA_DOMICILIAR' ? consulta.enderecoVisita : undefined,
          motivoConsulta: consulta.motivoConsulta,
          motivoDescricao: consulta.motivoDescricao,
        }),
      })
      if (!r1.ok) {
        const err = await r1.json()
        setError(err.error || 'Erro ao salvar atendimento.')
        return
      }
      const atendimentoData = await r1.json()
      const pid = atendimentoData.pacienteId || pacienteId

      // 2. Atualiza sinais vitais (upsert)
      if (sinais.peso || sinais.altura || sinais.paSistolica || sinais.glicemiaCapilar) {
        await fetch('/api/dados-clinicos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            atendimentoId,
            peso: sinais.peso ? Number(sinais.peso) : undefined,
            altura: sinais.altura ? Number(sinais.altura) : undefined,
            paSistolica: sinais.paSistolica ? Number(sinais.paSistolica) : undefined,
            paDiastolica: sinais.paDiastolica ? Number(sinais.paDiastolica) : undefined,
            freqCardiaca: sinais.freqCardiaca ? Number(sinais.freqCardiaca) : undefined,
            glicemiaCapilar: sinais.glicemiaCapilar ? Number(sinais.glicemiaCapilar) : undefined,
          }),
        })
      }

      // 3. Atualiza evolução clínica (upsert via POST)
      if (evolucao.evolucaoTexto || evolucao.adesao) {
        await fetch('/api/evolucao-clinica', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            atendimentoId,
            pacienteId: pid,
            adesao: evolucao.adesao || undefined,
            adesaoObs: evolucao.adesaoObs || undefined,
            evolucaoTexto: evolucao.evolucaoTexto || undefined,
          }),
        })
      }

      setSucesso(true)
      setTimeout(() => router.push(`/dashboard/pacientes/${pid}`), 1500)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-gray-500">Carregando atendimento...</p>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
        <h1 className="text-xl font-bold text-gray-900">Atendimento atualizado!</h1>
        <p className="text-gray-500 text-sm">Redirecionando ao prontuário...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        {pacienteId && (
          <Link href={`/dashboard/pacientes/${pacienteId}`} className="text-sm text-blue-600 hover:underline">
            ← Voltar ao Prontuário
          </Link>
        )}
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-bold text-gray-900">Editar Atendimento</h1>
          {dias > 0 && (
            <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full">
              {dias} dia{dias !== 1 ? 's' : ''} restante{dias !== 1 ? 's' : ''} para edição
            </span>
          )}
        </div>
        {dias === 0 && criadoEm && (
          <p className="mt-1 text-sm text-red-600">O prazo de edição de 7 dias encerrou.</p>
        )}
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Seção 1 — Dados da Consulta */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 border-b pb-2">Dados da Consulta</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">Data *</label>
            <input
              type="date"
              value={consulta.dataAtendimento}
              onChange={(e) => setConsulta({ ...consulta, dataAtendimento: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label className="label-base">Tipo de Atendimento *</label>
            <select
              value={consulta.tipo}
              onChange={(e) => setConsulta({ ...consulta, tipo: e.target.value })}
              className="input-base"
            >
              <option value="">Selecione...</option>
              {TIPOS_ATENDIMENTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        {consulta.tipo === 'VISITA_DOMICILIAR' && (
          <div>
            <label className="label-base">Endereço da Visita</label>
            <input
              type="text"
              value={consulta.enderecoVisita}
              onChange={(e) => setConsulta({ ...consulta, enderecoVisita: e.target.value })}
              className="input-base"
            />
          </div>
        )}
        <div>
          <label className="label-base">Motivo da Consulta</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {MOTIVOS_CONSULTA.map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  consulta.motivoConsulta.includes(m.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input type="checkbox" checked={consulta.motivoConsulta.includes(m.value)} onChange={() => toggleMotivo(m.value)} className="sr-only" />
                <span className="text-sm">{m.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="label-base">Observações</label>
          <textarea
            value={consulta.motivoDescricao}
            onChange={(e) => setConsulta({ ...consulta, motivoDescricao: e.target.value })}
            rows={3}
            className="input-base"
          />
        </div>
      </div>

      {/* Seção 2 — Sinais Vitais */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 border-b pb-2">Sinais Vitais e Antropometria <span className="text-xs font-normal text-gray-400">Opcional</span></h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'peso', label: 'Peso (kg)', step: '0.1' },
            { key: 'altura', label: 'Altura (m)', step: '0.01' },
            { key: 'paSistolica', label: 'PA Sistólica (mmHg)', step: '1' },
            { key: 'paDiastolica', label: 'PA Diastólica (mmHg)', step: '1' },
            { key: 'freqCardiaca', label: 'Freq. Cardíaca (bpm)', step: '1' },
            { key: 'glicemiaCapilar', label: 'Glicemia Capilar (mg/dL)', step: '1' },
          ].map(({ key, label, step }) => (
            <div key={key}>
              <label className="label-base">{label}</label>
              <input
                type="number"
                step={step}
                value={sinais[key as keyof typeof sinais]}
                onChange={(e) => setSinais({ ...sinais, [key]: e.target.value })}
                className="input-base"
              />
            </div>
          ))}
        </div>
        {imc && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm">
            <span className="font-medium text-blue-800">IMC: </span>
            <span className="text-blue-700">{imc.valor} kg/m² — {imc.classe}</span>
          </div>
        )}
      </div>

      {/* Seção 3 — Evolução */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 border-b pb-2">Evolução Clínica <span className="text-xs font-normal text-gray-400">Opcional</span></h2>
        <div>
          <label className="label-base">Adesão ao Tratamento</label>
          <div className="flex gap-3 mt-2">
            {(['BOA', 'REGULAR', 'BAIXA'] as const).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setEvolucao((e) => ({ ...e, adesao: e.adesao === op ? '' : op }))}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  evolucao.adesao === op
                    ? op === 'BOA' ? 'bg-green-100 border-green-400 text-green-800'
                      : op === 'REGULAR' ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                      : 'bg-red-100 border-red-400 text-red-800'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {op === 'BOA' ? '✓ Boa' : op === 'REGULAR' ? '~ Regular' : '✗ Baixa'}
              </button>
            ))}
          </div>
        </div>
        {evolucao.adesao && (
          <div>
            <label className="label-base">Observação sobre Adesão</label>
            <textarea
              value={evolucao.adesaoObs}
              onChange={(e) => setEvolucao({ ...evolucao, adesaoObs: e.target.value })}
              rows={2}
              className="input-base"
            />
          </div>
        )}
        <div>
          <label className="label-base">Evolução Clínica</label>
          <textarea
            value={evolucao.evolucaoTexto}
            onChange={(e) => setEvolucao({ ...evolucao, evolucaoTexto: e.target.value })}
            rows={5}
            placeholder="Descreva a evolução do paciente..."
            className="input-base"
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        {pacienteId && (
          <Link href={`/dashboard/pacientes/${pacienteId}`} className="btn-secondary">
            Cancelar
          </Link>
        )}
        <button
          onClick={salvar}
          disabled={saving || dias === 0}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Salvar Alterações
        </button>
      </div>
    </div>
  )
}
