'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pacienteSchema, PacienteForm as PacienteFormType } from '@/lib/validations/paciente'
import { validarCPF } from '@/lib/utils'
import { useState } from 'react'

export function PacienteForm({ paciente }: { paciente?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<PacienteFormType>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: paciente ? {
      ...paciente,
      dataNascimento: new Date(paciente.dataNascimento).toISOString().split('T')[0],
    } : undefined,
  })

  async function onSubmit(data: PacienteFormType) {
    setLoading(true)
    setError(null)

    if (!validarCPF(data.cpf)) {
      setError('CPF inválido')
      setLoading(false)
      return
    }

    const url = paciente ? `/api/cadastro-pacientes/${paciente.id}` : '/api/cadastro-pacientes'
    const method = paciente ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Erro ao salvar paciente')
      setLoading(false)
      return
    }

    const saved = await res.json()
    router.push(`/pacientes/${saved.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
          <input {...register('nome')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
          <input {...register('cpf')} placeholder="000.000.000-00" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento *</label>
          <input {...register('dataNascimento')} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          {errors.dataNascimento && <p className="text-red-500 text-xs mt-1">{errors.dataNascimento.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sexo *</label>
          <select {...register('sexo')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
            <option value="">Selecione...</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="OUTRO">Outro</option>
          </select>
          {errors.sexo && <p className="text-red-500 text-xs mt-1">{errors.sexo.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
          <input {...register('telefone')} placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <input {...register('endereco')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unidade de Saúde</label>
          <input {...register('unidadeSaude')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profissional Responsável</label>
          <input {...register('profissionalResponsavel')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 font-medium">
          {loading ? 'Salvando...' : 'Salvar Paciente'}
        </button>
      </div>
    </form>
  )
}
