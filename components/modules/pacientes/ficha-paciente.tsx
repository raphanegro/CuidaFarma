'use client'

import { useState } from 'react'
import { formatarCPF, calcularIdade } from '@/lib/utils'
import Link from 'next/link'

export function FichaPaciente({ paciente }: { paciente: any }) {
  const [activeTab, setActiveTab] = useState('dados')

  const tabs = [
    { id: 'dados', label: 'Dados Pessoais' },
    { id: 'medicamentos', label: 'Medicamentos' },
    { id: 'historico', label: 'Histórico Clínico' },
    { id: 'atendimentos', label: 'Atendimentos' },
    { id: 'anexos', label: 'Anexos' },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 border-b border-gray-200 w-full -mb-6 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6">
          {activeTab === 'dados' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><p className="text-gray-500">Nome</p><p className="font-medium">{paciente.nome}</p></div>
              <div><p className="text-gray-500">CPF</p><p className="font-medium">{formatarCPF(paciente.cpf)}</p></div>
              <div><p className="text-gray-500">Idade</p><p className="font-medium">{calcularIdade(new Date(paciente.dataNascimento))} anos</p></div>
              <div><p className="text-gray-500">Sexo</p><p className="font-medium">{paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Feminino' : 'Outro'}</p></div>
              <div><p className="text-gray-500">Telefone</p><p className="font-medium">{paciente.telefone}</p></div>
              <div><p className="text-gray-500">Unidade de Saúde</p><p className="font-medium">{paciente.unidadeSaude || '—'}</p></div>
              <div className="md:col-span-2"><p className="text-gray-500">Endereço</p><p className="font-medium">{paciente.endereco || '—'}</p></div>
              <div><p className="text-gray-500">Profissional Responsável</p><p className="font-medium">{paciente.profissionalResponsavel || '—'}</p></div>
            </div>
          )}

          {activeTab === 'medicamentos' && (
            <div>
              {paciente.medicamentos?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum medicamento cadastrado</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left py-2">Medicamento</th><th className="text-left py-2">Dose</th><th className="text-left py-2">Frequência</th><th className="text-left py-2">Indicação</th></tr></thead>
                  <tbody>
                    {paciente.medicamentos?.map((m: any) => (
                      <tr key={m.id} className="border-b border-gray-50">
                        <td className="py-2 font-medium">{m.nomeGenerico}</td>
                        <td className="py-2 text-gray-600">{m.dose}</td>
                        <td className="py-2 text-gray-600">{m.frequencia}</td>
                        <td className="py-2 text-gray-600">{m.indicacao || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'atendimentos' && (
            <div className="space-y-3">
              {paciente.atendimentos?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum atendimento registrado</p>
              ) : paciente.atendimentos?.map((a: any) => (
                <div key={a.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{a.tipoAtendimento.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {a.motivoConsulta && <p className="text-sm text-gray-600 mt-1">{a.motivoConsulta}</p>}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-2">
              {paciente.historicoClinicos?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum histórico registrado</p>
              ) : paciente.historicoClinicos?.map((h: any) => (
                <div key={h.id} className="border border-gray-200 rounded-lg p-3">
                  <p className="font-medium text-sm">{h.doenca}</p>
                  {h.descricao && <p className="text-sm text-gray-600">{h.descricao}</p>}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'anexos' && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Nenhum anexo
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Link href={`/pacientes/${paciente.id}/atendimento/novo`} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Novo Atendimento
        </Link>
        <Link href={`/pacientes/${paciente.id}/editar`} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
          Editar Dados
        </Link>
      </div>
    </div>
  )
}
