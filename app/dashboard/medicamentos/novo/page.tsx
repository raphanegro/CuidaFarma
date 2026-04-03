'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NovoMedicamentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    principioAtivo: '',
    dosagem: '',
    forma: '',
    fabricante: '',
    codigoATC: '',
  })

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
    setLoading(true)

    try {
      const response = await fetch('/api/medicamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao criar medicamento')
        return
      }

      router.push('/dashboard/medicamentos')
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Novo Medicamento</h1>
        <p className="text-gray-600 mt-2">Adicione um novo medicamento ao banco de dados</p>
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
              placeholder="Ex: Losartana Potássica"
              disabled={loading}
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
              placeholder="Ex: Losartana"
              disabled={loading}
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
              placeholder="Ex: 50mg"
              disabled={loading}
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
              disabled={loading}
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
              value={formData.fabricante}
              onChange={handleChange}
              className="input-base"
              placeholder="Ex: Laboratório XYZ"
              disabled={loading}
            />
          </div>
          <div>
            <label className="label-base">Código ATC</label>
            <input
              type="text"
              name="codigoATC"
              value={formData.codigoATC}
              onChange={handleChange}
              className="input-base"
              placeholder="Ex: C09CA01"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Medicamento'
            )}
          </button>
          <Link href="/dashboard/medicamentos" className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
