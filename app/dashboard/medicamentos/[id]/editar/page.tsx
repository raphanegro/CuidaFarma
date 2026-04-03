'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Medicamento {
  id: string
  nome: string
  principioAtivo: string
  dosagem: string
  forma: string
  fabricante?: string
  codigoATC?: string
}

export default function EditarMedicamentoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<Medicamento>({
    id: '',
    nome: '',
    principioAtivo: '',
    dosagem: '',
    forma: '',
    fabricante: '',
    codigoATC: '',
  })

  useEffect(() => {
    fetchMedicamento()
  }, [id])

  const fetchMedicamento = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/medicamentos/${id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Medicamento não encontrado')
      }

      const data = await response.json()
      setFormData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar medicamento')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/medicamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao atualizar medicamento')
        return
      }

      router.push(`/dashboard/medicamentos/${id}`)
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/medicamentos/${id}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Editar Medicamento</h1>
        <p className="text-gray-600 mt-2">Atualize as informações do medicamento</p>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">Nome do Medicamento *</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className="input-base"
              disabled={saving}
            />
          </div>
          <div>
            <label className="label-base">Princípio Ativo *</label>
            <input
              type="text"
              name="principioAtivo"
              value={formData.principioAtivo}
              onChange={handleChange}
              required
              className="input-base"
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">Dosagem *</label>
            <input
              type="text"
              name="dosagem"
              value={formData.dosagem}
              onChange={handleChange}
              required
              className="input-base"
              disabled={saving}
            />
          </div>
          <div>
            <label className="label-base">Forma Farmacêutica *</label>
            <select
              name="forma"
              value={formData.forma}
              onChange={handleChange}
              required
              className="input-base"
              disabled={saving}
            >
              <option value="">Selecione...</option>
              <option value="Comprimido">Comprimido</option>
              <option value="Cápsula">Cápsula</option>
              <option value="Solução">Solução</option>
              <option value="Suspensão">Suspensão</option>
              <option value="Injeção">Injeção</option>
              <option value="Patch">Patch</option>
              <option value="Spray">Spray</option>
              <option value="Pó">Pó</option>
              <option value="Pomada">Pomada</option>
              <option value="Crème">Crème</option>
              <option value="Gotas">Gotas</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">Fabricante</label>
            <input
              type="text"
              name="fabricante"
              value={formData.fabricante || ''}
              onChange={handleChange}
              className="input-base"
              disabled={saving}
            />
          </div>
          <div>
            <label className="label-base">Código ATC</label>
            <input
              type="text"
              name="codigoATC"
              value={formData.codigoATC || ''}
              onChange={handleChange}
              className="input-base"
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Medicamento'
            )}
          </button>
          <Link href={`/dashboard/medicamentos/${id}`} className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
