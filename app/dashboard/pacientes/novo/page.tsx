'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { validarCPF, formatarCPF, limparCPF } from '@/lib/cpf'
import { formatarTelefone, formatarCEP } from '@/lib/masks'

export default function NovoPacientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cpfError, setCpfError] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    cpf: '',
    dataNascimento: '',
    genero: '',
    telefone: '',
    telefoneSecundario: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    unidadeSaude: '',
    profissionalResponsavel: '',
    notas: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    if (name === 'cpf') {
      const formatted = formatarCPF(value)
      setFormData({ ...formData, cpf: formatted })
      if (limparCPF(value).length === 11) {
        setCpfError(validarCPF(value) ? '' : 'CPF inválido')
      } else {
        setCpfError('')
      }
      return
    }

    if (name === 'telefone' || name === 'telefoneSecundario') {
      setFormData({ ...formData, [name]: formatarTelefone(value) })
      return
    }

    if (name === 'cep') {
      setFormData({ ...formData, cep: formatarCEP(value) })
      return
    }

    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validarCPF(formData.cpf)) {
      setCpfError('CPF inválido')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao criar paciente')
        return
      }

      router.push('/dashboard/pacientes')
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Novo Paciente</h1>
        <p className="text-gray-600 mt-2">Preencha os dados do paciente</p>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Dados Pessoais */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados Pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Nome *</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="input-base" disabled={loading} />
            </div>
            <div>
              <label className="label-base">Sobrenome *</label>
              <input type="text" name="sobrenome" value={formData.sobrenome} onChange={handleChange} required className="input-base" disabled={loading} />
            </div>
            <div>
              <label className="label-base">CPF *</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                maxLength={14}
                className={`input-base ${cpfError ? 'border-red-500' : ''}`}
                placeholder="000.000.000-00"
                disabled={loading}
              />
              {cpfError && <p className="mt-1 text-xs text-red-600">{cpfError}</p>}
            </div>
            <div>
              <label className="label-base">Data de Nascimento *</label>
              <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} required className="input-base" disabled={loading} />
            </div>
            <div>
              <label className="label-base">Gênero</label>
              <select name="genero" value={formData.genero} onChange={handleChange} className="input-base" disabled={loading}>
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contato</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Telefone Principal</label>
              <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="input-base" placeholder="(00) 00000-0000" maxLength={15} disabled={loading} />
            </div>
            <div>
              <label className="label-base">Telefone Secundário</label>
              <input type="tel" name="telefoneSecundario" value={formData.telefoneSecundario} onChange={handleChange} className="input-base" placeholder="(00) 00000-0000" maxLength={15} disabled={loading} />
            </div>
            <div className="col-span-2">
              <label className="label-base">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-base" disabled={loading} />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h2>
          <div className="space-y-4">
            <div>
              <label className="label-base">Endereço</label>
              <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className="input-base" disabled={loading} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label-base">Cidade</label>
                <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="input-base" disabled={loading} />
              </div>
              <div>
                <label className="label-base">Estado</label>
                <input type="text" name="estado" value={formData.estado} onChange={handleChange} className="input-base" maxLength={2} placeholder="SP" disabled={loading} />
              </div>
              <div>
                <label className="label-base">CEP</label>
                <input type="text" name="cep" value={formData.cep} onChange={handleChange} className="input-base" placeholder="00000-000" maxLength={9} disabled={loading} />
              </div>
            </div>
          </div>
        </div>

        {/* Dados Clínico-Administrativos */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados Clínico-Administrativos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Unidade de Saúde</label>
              <input type="text" name="unidadeSaude" value={formData.unidadeSaude} onChange={handleChange} className="input-base" placeholder="UBS Centro, CAPS..." disabled={loading} />
            </div>
            <div>
              <label className="label-base">Profissional Responsável</label>
              <input type="text" name="profissionalResponsavel" value={formData.profissionalResponsavel} onChange={handleChange} className="input-base" placeholder="Dr. João Silva" disabled={loading} />
            </div>
            <div className="col-span-2">
              <label className="label-base">Notas Adicionais</label>
              <textarea name="notas" value={formData.notas} onChange={handleChange} className="input-base" rows={3} disabled={loading} />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button type="submit" disabled={loading || !!cpfError} className="btn-primary flex items-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Criando...</> : 'Criar Paciente'}
          </button>
          <Link href="/dashboard/pacientes" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
