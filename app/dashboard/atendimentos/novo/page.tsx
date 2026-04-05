'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

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

interface MedEmUso {
  id: string
  nome: string
  dose?: string | null
  frequencia?: string | null
  qtdAnterior?: number | null
}

const PASSOS = [
  { num: 1, label: 'Consulta' },
  { num: 2, label: 'Sinais Vitais' },
  { num: 3, label: 'Adesão' },
  { num: 4, label: 'Evolução' },
  { num: 5, label: 'Retorno' },
]

function calcularIMC(peso: string, altura: string) {
  const p = parseFloat(peso)
  const a = parseFloat(altura)
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

export default function NovoAtendimentoPage() {
  const searchParams = useSearchParams()
  const pacienteId = searchParams.get('pacienteId') || ''

  const [passo, setPasso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [atendimentoId, setAtendimentoId] = useState('')

  // Passo 3 — Medicamentos em uso para contagem de adesão
  const [medsEmUso, setMedsEmUso] = useState<MedEmUso[]>([])
  const [contagens, setContagens] = useState<Record<string, { qtdEsperada: string; qtdContada: string; obs: string }>>({})
  const [loadingMeds, setLoadingMeds] = useState(false)

  // Passo 1 — Consulta
  const [consulta, setConsulta] = useState({
    tipo: '',
    enderecoVisita: '',
    motivoConsulta: [] as string[],
    motivoDescricao: '',
    dataAtendimento: new Date().toISOString().split('T')[0],
  })

  // Passo 2 — Sinais Vitais
  const [sinais, setSinais] = useState({
    peso: '', altura: '', paSistolica: '', paDiastolica: '', freqCardiaca: '', glicemiaCapilar: '',
  })

  // Passo 3 — Evolução
  const [evolucao, setEvolucao] = useState({
    adesao: '' as '' | 'BOA' | 'REGULAR' | 'BAIXA',
    adesaoObs: '',
    evolucaoTexto: '',
  })

  // Passo 4 — Retorno
  const [retorno, setRetorno] = useState({
    proximoRetorno: '',
    tipoAtendimentoProgramado: '',
  })

  const [concluido, setConcluido] = useState(false)

  const toggleMotivo = (v: string) => {
    setConsulta((c) => ({
      ...c,
      motivoConsulta: c.motivoConsulta.includes(v)
        ? c.motivoConsulta.filter((m) => m !== v)
        : [...c.motivoConsulta, v],
    }))
  }

  const imc = calcularIMC(sinais.peso, sinais.altura)

  // Passo 1 → cria atendimento
  async function avancarPasso1() {
    setError('')
    if (!pacienteId) { setError('ID do paciente ausente'); return }
    if (!consulta.tipo) { setError('Selecione o tipo de atendimento'); return }
    if (consulta.tipo === 'VISITA_DOMICILIAR' && !consulta.enderecoVisita.trim()) {
      setError('Informe o endereço da visita')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId, ...consulta }),
      })
      if (!r.ok) { setError((await r.json()).error || 'Erro ao criar atendimento'); return }
      const data = await r.json()
      setAtendimentoId(data.id)
      setPasso(2)
    } catch { setError('Erro de conexão') }
    finally { setLoading(false) }
  }

  // Passo 2 → salva sinais vitais (opcional), carrega meds para passo 3
  async function avancarPasso2(pular = false) {
    setError('')
    if (!pular && (sinais.peso || sinais.altura || sinais.paSistolica || sinais.glicemiaCapilar)) {
      setLoading(true)
      try {
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
      } catch { /* silently continue */ }
      finally { setLoading(false) }
    }
    // Carrega medicamentos em uso e última contagem para passo 3
    setLoadingMeds(true)
    try {
      const [resMeds, resAnteriores] = await Promise.all([
        fetch(`/api/medicamentos-em-uso?pacienteId=${pacienteId}&status=EM_USO`),
        fetch(`/api/avaliacao-adesao/resumo?pacienteId=${pacienteId}`),
      ])
      const meds = resMeds.ok ? await resMeds.json() : []
      const anterioresArr: { medicamentoEmUsoId: string; qtdContada: number }[] = resAnteriores.ok ? await resAnteriores.json() : []
      const anteriores: Record<string, number> = {}
      anterioresArr.forEach((a) => { anteriores[a.medicamentoEmUsoId] = a.qtdContada })
      const lista: MedEmUso[] = meds.map((m: { id: string; nomeCustom?: string; dose?: string; frequencia?: string; medicamento?: { nome: string } }) => ({
        id: m.id,
        nome: m.medicamento?.nome ?? m.nomeCustom ?? 'Medicamento',
        dose: m.dose,
        frequencia: m.frequencia,
        qtdAnterior: anteriores[m.id] ?? null,
      }))
      setMedsEmUso(lista)
      const init: Record<string, { qtdEsperada: string; qtdContada: string; obs: string }> = {}
      lista.forEach((m) => { init[m.id] = { qtdEsperada: '', qtdContada: '', obs: '' } })
      setContagens(init)
    } catch { /* silently continue */ }
    finally { setLoadingMeds(false) }
    setPasso(3)
  }

  // Passo 3 → salva contagens de adesão (opcional por medicamento)
  async function avancarPasso3(pular = false) {
    setError('')
    if (!pular) {
      const linhasPreenchidas = Object.entries(contagens).filter(([, v]) => v.qtdEsperada && v.qtdContada)
      if (linhasPreenchidas.length > 0) {
        setLoading(true)
        try {
          await Promise.all(
            linhasPreenchidas.map(([medId, v]) =>
              fetch('/api/avaliacao-adesao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  atendimentoId,
                  pacienteId,
                  medicamentoEmUsoId: medId,
                  qtdEsperada: Number(v.qtdEsperada),
                  qtdContada: Number(v.qtdContada),
                  observacao: v.obs || undefined,
                }),
              })
            )
          )
        } catch { /* silently continue */ }
        finally { setLoading(false) }
      }
    }
    setPasso(4)
  }

  // Passo 4 → salva evolução (opcional)
  async function avancarPasso4(pular = false) {
    setError('')
    if (!pular && evolucao.evolucaoTexto.trim()) {
      setLoading(true)
      try {
        await fetch('/api/evolucao-clinica', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            atendimentoId,
            pacienteId,
            adesao: evolucao.adesao || undefined,
            adesaoObs: evolucao.adesaoObs || undefined,
            evolucaoTexto: evolucao.evolucaoTexto,
          }),
        })
      } catch { /* silently continue */ }
      finally { setLoading(false) }
    }
    setPasso(5)
  }

  // Passo 5 → salva retorno (opcional) e conclui
  async function concluir(pular = false) {
    setError('')
    if (!pular && retorno.proximoRetorno) {
      setLoading(true)
      try {
        await fetch('/api/plano-acompanhamento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pacienteId,
            proximoRetorno: new Date(retorno.proximoRetorno).toISOString(),
            tipoAtendimentoProgramado: retorno.tipoAtendimentoProgramado || undefined,
          }),
        })
      } catch { /* silently continue */ }
      finally { setLoading(false) }
    }
    // Marca atendimento como concluído
    await fetch(`/api/atendimentos/${atendimentoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONCLUIDO' }),
    }).catch(() => {})
    setConcluido(true)
  }

  // ── UI ──────────────────────────────────────────────────────────────────────

  if (concluido) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Atendimento Registrado</h1>
        <p className="text-gray-500">O atendimento foi salvo com sucesso.</p>
        <div className="flex flex-col gap-3 pt-2">
          <Link href={`/dashboard/pacientes/${pacienteId}`} className="btn-primary">
            Voltar ao Prontuário
          </Link>
          <Link href={`/dashboard/pacientes/${pacienteId}/prf`} className="btn-secondary">
            Registrar PRF
          </Link>
          <Link href={`/dashboard/pacientes/${pacienteId}/intervencoes`} className="btn-secondary">
            Criar Intervenção
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={pacienteId ? `/dashboard/pacientes/${pacienteId}` : '/dashboard/pacientes'}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Voltar ao Prontuário
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Novo Atendimento</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {PASSOS.map((p, i) => (
          <div key={p.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                passo > p.num ? 'bg-green-500 border-green-500 text-white'
                : passo === p.num ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {passo > p.num ? <CheckCircle className="h-4 w-4" /> : p.num}
              </div>
              <span className={`text-xs mt-1 font-medium ${passo === p.num ? 'text-blue-600' : 'text-gray-400'}`}>
                {p.label}
              </span>
            </div>
            {i < PASSOS.length - 1 && (
              <div className={`flex-1 h-px mt-[-14px] ${passo > p.num ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Erro */}
      {error && (
        <div className="flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── PASSO 1: CONSULTA ─────────────────────────────────────────────── */}
      {passo === 1 && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-800">Dados da Consulta</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="label-base">Data *</label>
              <input
                type="date"
                value={consulta.dataAtendimento}
                onChange={(e) => setConsulta({ ...consulta, dataAtendimento: e.target.value })}
                className="input-base"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="label-base">Tipo de Atendimento *</label>
              <select
                value={consulta.tipo}
                onChange={(e) => setConsulta({ ...consulta, tipo: e.target.value, enderecoVisita: '' })}
                className="input-base"
                required
              >
                <option value="">Selecione...</option>
                {TIPOS_ATENDIMENTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {consulta.tipo === 'VISITA_DOMICILIAR' && (
            <div>
              <label className="label-base">Endereço da Visita *</label>
              <input
                type="text"
                value={consulta.enderecoVisita}
                onChange={(e) => setConsulta({ ...consulta, enderecoVisita: e.target.value })}
                placeholder="Rua, número, bairro, cidade"
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
              placeholder="Detalhes adicionais sobre a consulta..."
              className="input-base"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={avancarPasso1} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── PASSO 2: SINAIS VITAIS ────────────────────────────────────────── */}
      {passo === 2 && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Sinais Vitais e Antropometria</h2>
            <span className="text-xs text-gray-400">Opcional</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'peso', label: 'Peso (kg)', placeholder: '70.5', step: '0.1' },
              { key: 'altura', label: 'Altura (m)', placeholder: '1.70', step: '0.01' },
              { key: 'paSistolica', label: 'PA Sistólica (mmHg)', placeholder: '120', step: '1' },
              { key: 'paDiastolica', label: 'PA Diastólica (mmHg)', placeholder: '80', step: '1' },
              { key: 'freqCardiaca', label: 'Freq. Cardíaca (bpm)', placeholder: '72', step: '1' },
              { key: 'glicemiaCapilar', label: 'Glicemia Capilar (mg/dL)', placeholder: '95', step: '1' },
            ].map(({ key, label, placeholder, step }) => (
              <div key={key}>
                <label className="label-base">{label}</label>
                <input
                  type="number"
                  step={step}
                  value={sinais[key as keyof typeof sinais]}
                  onChange={(e) => setSinais({ ...sinais, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="input-base"
                />
              </div>
            ))}
          </div>

          {imc && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm">
              <span className="font-medium text-blue-800">IMC calculado: </span>
              <span className="text-blue-700">{imc.valor} kg/m² — {imc.classe}</span>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setPasso(1)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex gap-2">
              <button onClick={() => avancarPasso2(true)} className="btn-secondary text-sm">
                Pular
              </button>
              <button onClick={() => avancarPasso2(false)} disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar e Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASSO 3: CONTAGEM DE MEDICAMENTOS (ADESÃO) ───────────────────── */}
      {passo === 3 && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Contagem de Medicamentos</h2>
            <span className="text-xs text-gray-400">Opcional</span>
          </div>

          {loadingMeds ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando medicamentos...
            </div>
          ) : medsEmUso.length === 0 ? (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
              <p>Nenhum medicamento em uso cadastrado para este paciente.</p>
              <p className="mt-1 text-xs">Adicione medicamentos no prontuário antes de realizar a contagem.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Para cada medicamento, informe a quantidade esperada (desde a última visita) e a quantidade contada. Deixe em branco para pular.
              </p>
              {medsEmUso.map((med) => {
                const c = contagens[med.id] ?? { qtdEsperada: '', qtdContada: '', obs: '' }
                const preenchido = c.qtdEsperada && c.qtdContada
                const taxa = preenchido
                  ? Math.min(Math.round((Number(c.qtdContada) / Number(c.qtdEsperada)) * 100), 100)
                  : null
                const cor = taxa === null ? 'gray' : taxa >= 80 ? 'green' : taxa >= 60 ? 'yellow' : 'red'
                return (
                  <div key={med.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{med.nome}</p>
                        {(med.dose || med.frequencia) && (
                          <p className="text-xs text-gray-500">{[med.dose, med.frequencia].filter(Boolean).join(' — ')}</p>
                        )}
                        {med.qtdAnterior !== null && (
                          <p className="text-xs text-blue-600 mt-0.5">Última visita: {med.qtdAnterior} comprimidos contados</p>
                        )}
                      </div>
                      {taxa !== null && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          cor === 'green' ? 'bg-green-100 text-green-700'
                          : cor === 'yellow' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {taxa}% adesão
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-base text-xs">Qtd. Esperada</label>
                        <input
                          type="number"
                          min="0"
                          value={c.qtdEsperada}
                          onChange={(e) => setContagens((prev) => ({ ...prev, [med.id]: { ...c, qtdEsperada: e.target.value } }))}
                          placeholder="ex: 30"
                          className="input-base"
                        />
                      </div>
                      <div>
                        <label className="label-base text-xs">Qtd. Contada</label>
                        <input
                          type="number"
                          min="0"
                          value={c.qtdContada}
                          onChange={(e) => setContagens((prev) => ({ ...prev, [med.id]: { ...c, qtdContada: e.target.value } }))}
                          placeholder="ex: 25"
                          className="input-base"
                        />
                      </div>
                    </div>
                    {preenchido && (
                      <div>
                        <label className="label-base text-xs">Observação (opcional)</label>
                        <input
                          type="text"
                          value={c.obs}
                          onChange={(e) => setContagens((prev) => ({ ...prev, [med.id]: { ...c, obs: e.target.value } }))}
                          placeholder="Ex: paciente relatou esquecimentos nos fins de semana"
                          className="input-base"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setPasso(2)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex gap-2">
              <button onClick={() => avancarPasso3(true)} className="btn-secondary text-sm">
                Pular
              </button>
              <button onClick={() => avancarPasso3(false)} disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar e Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASSO 4: EVOLUÇÃO ─────────────────────────────────────────────── */}
      {passo === 4 && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Evolução Clínica</h2>
            <span className="text-xs text-gray-400">Opcional</span>
          </div>

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
                placeholder="Descreva os fatores que influenciam a adesão..."
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
              placeholder="Descreva a evolução do paciente, observações clínicas, resposta ao tratamento..."
              className="input-base"
            />
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setPasso(3)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex gap-2">
              <button onClick={() => avancarPasso4(true)} className="btn-secondary text-sm">
                Pular
              </button>
              <button onClick={() => avancarPasso4(false)} disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar e Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASSO 5: RETORNO ──────────────────────────────────────────────── */}
      {passo === 5 && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Próximo Retorno</h2>
            <span className="text-xs text-gray-400">Opcional</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Data do Retorno</label>
              <input
                type="date"
                value={retorno.proximoRetorno}
                onChange={(e) => setRetorno({ ...retorno, proximoRetorno: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">Tipo de Atendimento</label>
              <select
                value={retorno.tipoAtendimentoProgramado}
                onChange={(e) => setRetorno({ ...retorno, tipoAtendimentoProgramado: e.target.value })}
                className="input-base"
              >
                <option value="">Selecione...</option>
                {TIPOS_ATENDIMENTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setPasso(4)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex gap-2">
              <button onClick={() => concluir(true)} disabled={loading} className="btn-secondary text-sm">
                Concluir sem Retorno
              </button>
              <button onClick={() => concluir(false)} disabled={loading || !retorno.proximoRetorno} className="btn-primary flex items-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Concluir Atendimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
