'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const atendimentoSchema = z.object({
  tipoAtendimento: z.enum(['CONSULTA_UBS', 'CONSULTORIO_FARMACEUTICO', 'VISITA_DOMICILIAR', 'TELEATENDIMENTO']),
  motivoConsulta: z.string().optional(),
  detalhesVisita: z.string().optional(),
})

type AtendimentoFormData = z.infer<typeof atendimentoSchema>

export function AtendimentoForm({ paciente }: { paciente: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AtendimentoFormData>({
    resolver: zodResolver(atendimentoSchema),
  })

  const tipoAtendimento = watch('tipoAtendimento')

  async function onSubmit(data: AtendimentoFormData) {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/tipo-atendimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, pacienteId: paciente.id }),
    })

    if (!res.ok) {
      setError('Erro ao registrar atendimento')
      setLoading(false)
      return
    }

    router.push(`/pacientes/${paciente.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Atendimento *</label>
        <select {...register('tipoAtendimento')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
          <option value="">Selecione...</option>
          <option value="CONSULTA_UBS">Consulta na UBS</option>
          <option value="CONSULTORIO_FARMACEUTICO">Consultório Farmacêutico</option>
          <option value="VISITA_DOMICILIAR">Visita Domiciliar</option>
          <option value="TELEATENDIMENTO">Teleatendimento</option>
        </select>
        {errors.tipoAtendimento && <p className="text-red-500 text-xs mt-1">{errors.tipoAtendimento.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Consulta</label>
        <textarea {...register('motivoConsulta')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
      </div>

      {tipoAtendimento === 'VISITA_DOMICILIAR' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detalhes da Visita Domiciliar</label>
          <textarea {...register('detalhesVisita')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 font-medium">
          {loading ? 'Salvando...' : 'Iniciar Atendimento'}
        </button>
      </div>
    </form>
  )
}
