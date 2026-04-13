'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CapturafotoMedicamento } from './captura-foto'

interface EditarMedicamentoProps {
  medicamento: any
  pacienteId: string
}

export function EditarMedicamento({ medicamento, pacienteId }: EditarMedicamentoProps) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [formData, setFormData] = useState({
    nomeGenerico: medicamento.nomeGenerico,
    dose: medicamento.dose,
    formaFarmaceutica: medicamento.formaFarmaceutica || '',
    viaAdministracao: medicamento.viaAdministracao || '',
    frequencia: medicamento.frequencia,
    indicacao: medicamento.indicacao || '',
    origem: medicamento.origem || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    setErro(null)
    setSucesso(false)

    try {
      const response = await fetch(`/api/medicamentos-usos/${medicamento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar medicamento')
      }

      setSucesso(true)
      setTimeout(() => {
        router.push(`/pacientes/${pacienteId}`)
      }, 1500)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao atualizar medicamento')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulário */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {erro && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{erro}</div>
          )}

          {sucesso && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm">
              ✓ Medicamento atualizado com sucesso! Redirecionando...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicamento (Genérico) *
              </label>
              <input
                type="text"
                name="nomeGenerico"
                value={formData.nomeGenerico}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dose *
                </label>
                <input
                  type="text"
                  name="dose"
                  value={formData.dose}
                  onChange={handleChange}
                  placeholder="Ex: 500mg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequência *
                </label>
                <input
                  type="text"
                  name="frequencia"
                  value={formData.frequencia}
                  onChange={handleChange}
                  placeholder="Ex: 3x ao dia"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma Farmacêutica
                </label>
                <select
                  name="formaFarmaceutica"
                  value={formData.formaFarmaceutica}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="Comprimido">Comprimido</option>
                  <option value="Capsula">Cápsula</option>
                  <option value="Solução">Solução</option>
                  <option value="Suspensão">Suspensão</option>
                  <option value="Injeção">Injeção</option>
                  <option value="Pomada">Pomada</option>
                  <option value="Gotas">Gotas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Via de Administração
                </label>
                <select
                  name="viaAdministracao"
                  value={formData.viaAdministracao}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="Oral">Oral</option>
                  <option value="Intravenosa">Intravenosa</option>
                  <option value="Intramuscular">Intramuscular</option>
                  <option value="Subcutânea">Subcutânea</option>
                  <option value="Tópica">Tópica</option>
                  <option value="Inalação">Inalação</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indicação
              </label>
              <textarea
                name="indicacao"
                value={formData.indicacao}
                onChange={handleChange}
                placeholder="Motivo pelo qual o medicamento foi prescrito"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origem
              </label>
              <select
                name="origem"
                value={formData.origem}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="Prescrito">Prescrito</option>
                <option value="Automedicação">Automedicação</option>
                <option value="Farmácia Popular">Farmácia Popular</option>
                <option value="Programa SUS">Programa SUS</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={carregando}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {carregando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <Link
                href={`/pacientes/${pacienteId}`}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium text-center hover:bg-gray-50"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Seção de Foto */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Fotografia do Medicamento</h3>

            {medicamento.fotografia && (
              <div className="mb-4">
                <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square">
                  <img
                    src={medicamento.fotografia}
                    alt={medicamento.nomeGenerico}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Foto atual</p>
              </div>
            )}

            <CapturafotoMedicamento
              medicamentoId={medicamento.id}
              fotoAtual={medicamento.fotografia}
              onFotoCapturada={() => {
                // Refresh da página para atualizar a foto
                window.location.reload()
              }}
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              📸 A fotografia do medicamento ajuda a identificar visualmente o produto utilizado pelo paciente, facilitando a farmacoterapia e consultas futuras.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
