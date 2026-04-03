'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2, FileText, Phone, Mail, Building2 } from 'lucide-react'
import { formatarCPF } from '@/lib/cpf'

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
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [unidadeSaude, setUnidadeSaude] = useState('')

  const fetchPacientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (unidadeSaude) params.set('unidadeSaude', unidadeSaude)

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
  }, [search, unidadeSaude])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPacientes()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchPacientes])

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este paciente?')) {
      try {
        const response = await fetch(`/api/pacientes/${id}`, { method: 'DELETE' })
        if (response.ok) {
          setPacientes(pacientes.filter((p) => p.id !== id))
        }
      } catch (error) {
        console.error('Erro ao deletar paciente:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
        <Link href="/dashboard/pacientes/novo" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Paciente
        </Link>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
          />
        </div>
        <div className="relative">
          <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrar por unidade de saúde..."
            value={unidadeSaude}
            onChange={(e) => setUnidadeSaude(e.target.value)}
            className="input-base pl-10"
          />
        </div>
      </div>

      {/* Lista de Pacientes */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Carregando pacientes...</div>
        </div>
      ) : pacientes.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500 mb-4">
            {search || unidadeSaude ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          </p>
          {!search && !unidadeSaude && (
            <Link
              href="/dashboard/pacientes/novo"
              className="btn-primary inline-flex items-center gap-2"
            >
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
                              {paciente.telefone}
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
