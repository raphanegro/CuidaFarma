'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2, FileText, Phone, Mail, Building2, ChevronDown, X } from 'lucide-react'
import { formatarCPF } from '@/lib/cpf'
import { formatarTelefone } from '@/lib/masks'

interface Paciente {
  id: string
  nome: string
  sobrenome: string
  cpf: string
  email?: string
  telefone?: string
  dataNascimento?: string
  unidadeSaude?: string
  profissionalResponsavel?: string
  ativo: boolean
  estratificacoesRisco: { nivelRisco: string }[]
}

const RISCO_CONFIG: Record<string, { label: string; cls: string }> = {
  BAIXO:    { label: 'Baixo',    cls: 'bg-green-100 text-green-700 border-green-200' },
  MODERADO: { label: 'Moderado', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  ALTO:     { label: 'Alto',     cls: 'bg-red-100 text-red-700 border-red-200' },
  CRITICO:  { label: 'Crítico',  cls: 'bg-purple-100 text-purple-700 border-purple-200' },
}

const RISCO_OPCOES = [
  { value: '', label: 'Todos os riscos' },
  { value: 'BAIXO', label: 'Baixo' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'CRITICO', label: 'Crítico' },
]


const BUSCA_RECENTE_KEY = 'cuidafarma:buscas_recentes'

function getBuscasRecentes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BUSCA_RECENTE_KEY) || '[]')
  } catch {
    return []
  }
}

function salvarBuscaRecente(termo: string) {
  if (!termo.trim()) return
  const recentes = getBuscasRecentes().filter((b) => b !== termo)
  const novas = [termo, ...recentes].slice(0, 5)
  localStorage.setItem(BUSCA_RECENTE_KEY, JSON.stringify(novas))
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [unidadeSaude, setUnidadeSaude] = useState('')
  const [doenca, setDoenca] = useState('')
  const [medicamento, setMedicamento] = useState('')
  const [risco, setRisco] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [buscasRecentes, setBuscasRecentes] = useState<string[]>([])
  const [showRecentes, setShowRecentes] = useState(false)

  useEffect(() => {
    setBuscasRecentes(getBuscasRecentes())
  }, [])

  const fetchPacientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (unidadeSaude) params.set('unidadeSaude', unidadeSaude)
      if (doenca) params.set('doenca', doenca)
      if (medicamento) params.set('medicamento', medicamento)
      if (risco) params.set('risco', risco)

      const response = await fetch(`/api/pacientes?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPacientes(data)
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
    } finally {
      setLoading(false)
    }
  }, [search, unidadeSaude, doenca, medicamento, risco])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPacientes()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchPacientes])

  const handleSearchBlur = () => {
    if (search.trim()) {
      salvarBuscaRecente(search.trim())
      setBuscasRecentes(getBuscasRecentes())
    }
    setTimeout(() => setShowRecentes(false), 150)
  }

  const aplicarBuscaRecente = (termo: string) => {
    setSearch(termo)
    setShowRecentes(false)
  }

  const limparBuscasRecentes = () => {
    localStorage.removeItem(BUSCA_RECENTE_KEY)
    setBuscasRecentes([])
    setShowRecentes(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este paciente? Esta ação não pode ser desfeita.')) {
      try {
        const response = await fetch(`/api/pacientes/${id}`, { method: 'DELETE' })
        if (response.ok) {
          setPacientes(pacientes.filter((p) => p.id !== id))
        } else {
          const data = await response.json().catch(() => ({}))
          alert(data.error || 'Erro ao deletar paciente')
        }
      } catch {
        alert('Erro de conexão ao deletar paciente')
      }
    }
  }

  const filtrosAtivos = [
    unidadeSaude && { label: `Unidade: ${unidadeSaude}`, clear: () => setUnidadeSaude('') },
    doenca && { label: `Doença: ${doenca}`, clear: () => setDoenca('') },
    medicamento && { label: `Medicamento: ${medicamento}`, clear: () => setMedicamento('') },
    risco && { label: `Risco: ${RISCO_OPCOES.find((r) => r.value === risco)?.label}`, clear: () => setRisco('') },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
        <Link href="/dashboard/pacientes/novo" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Paciente
        </Link>
      </div>

      {/* Busca principal */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowRecentes(buscasRecentes.length > 0)}
            onBlur={handleSearchBlur}
            className="input-base pl-10"
          />
          {showRecentes && buscasRecentes.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Buscas recentes</span>
                <button onClick={limparBuscasRecentes} className="text-xs text-red-500 hover:text-red-700">Limpar</button>
              </div>
              {buscasRecentes.map((b) => (
                <button
                  key={b}
                  onMouseDown={() => aplicarBuscaRecente(b)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Search className="h-3.5 w-3.5 text-gray-400" />
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            mostrarFiltros || filtrosAtivos.length > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Filtros
          {filtrosAtivos.length > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {filtrosAtivos.length}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Painel de filtros avançados */}
      {mostrarFiltros && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unidade de Saúde</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ex: UBS Central"
                value={unidadeSaude}
                onChange={(e) => setUnidadeSaude(e.target.value)}
                className="input-base pl-9 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Doença / Patologia</label>
            <input
              type="text"
              placeholder="Ex: Diabetes, Hipertensão"
              value={doenca}
              onChange={(e) => setDoenca(e.target.value)}
              className="input-base py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Medicamento em uso</label>
            <input
              type="text"
              placeholder="Ex: Metformina, Enalapril"
              value={medicamento}
              onChange={(e) => setMedicamento(e.target.value)}
              className="input-base py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nível de Risco</label>
            <select
              value={risco}
              onChange={(e) => setRisco(e.target.value)}
              className="input-base py-2 text-sm"
            >
              {RISCO_OPCOES.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tags de filtros ativos */}
      {filtrosAtivos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filtrosAtivos.map((f) => (
            <span key={f.label} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
              {f.label}
              <button onClick={f.clear} className="hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={() => { setUnidadeSaude(''); setDoenca(''); setMedicamento(''); setRisco('') }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Lista de Pacientes */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Carregando pacientes...</div>
        </div>
      ) : pacientes.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500 mb-4">
            {search || filtrosAtivos.length > 0 ? 'Nenhum paciente encontrado com esses filtros' : 'Nenhum paciente cadastrado'}
          </p>
          {!search && filtrosAtivos.length === 0 && (
            <Link href="/dashboard/pacientes/novo" className="btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Primeiro Paciente
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 text-sm text-gray-500">
            {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} encontrado{pacientes.length !== 1 ? 's' : ''}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Nome</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">CPF</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Risco</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Contato</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Unidade de Saúde</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((paciente) => (
                  <tr key={paciente.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <Link
                        href={`/dashboard/pacientes/${paciente.id}`}
                        className="hover:text-primary-600 transition-colors"
                      >
                        {paciente.nome} {paciente.sobrenome}
                      </Link>
                      {!paciente.ativo && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {formatarCPF(paciente.cpf)}
                    </td>
                    <td className="px-6 py-4">
                      {paciente.estratificacoesRisco[0] ? (() => {
                        const r = RISCO_CONFIG[paciente.estratificacoesRisco[0].nivelRisco]
                        return r ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${r.cls}`}>
                            {r.label}
                          </span>
                        ) : null
                      })() : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        {paciente.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            <a href={`mailto:${paciente.email}`} className="text-primary-600 hover:underline">
                              {paciente.email}
                            </a>
                          </div>
                        )}
                        {paciente.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <a href={`tel:${paciente.telefone}`} className="text-primary-600 hover:underline">
                              {formatarTelefone(paciente.telefone)}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {paciente.unidadeSaude || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/pacientes/${paciente.id}`}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Prontuário"
                        >
                          <FileText className="h-4 w-4 text-gray-600" />
                        </Link>
                        <button
                          onClick={() => handleDelete(paciente.id)}
                          className="p-2 hover:bg-red-100 rounded transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
