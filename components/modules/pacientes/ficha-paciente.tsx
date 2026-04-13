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
            <div className="space-y-4">
              {paciente.medicamentos?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum medicamento cadastrado</p>
              ) : (
                <div className="space-y-4">
                  {paciente.medicamentos?.map((m: any) => (
                    <div key={m.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex gap-4">
                        {m.fotografia && (
                          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={m.fotografia} alt={m.nomeGenerico} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{m.nomeGenerico}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2 text-gray-600">
                            <div><span className="text-gray-500">Dose:</span> {m.dose}</div>
                            <div><span className="text-gray-500">Frequência:</span> {m.frequencia}</div>
                            {m.formaFarmaceutica && (
                              <div><span className="text-gray-500">Forma:</span> {m.formaFarmaceutica}</div>
                            )}
                            {m.viaAdministracao && (
                              <div><span className="text-gray-500">Via:</span> {m.viaAdministracao}</div>
                            )}
                            {m.indicacao && (
                              <div className="col-span-2"><span className="text-gray-500">Indicação:</span> {m.indicacao}</div>
                            )}
                          </div>
                          <div className="mt-3">
                            <Link
                              href={`/pacientes/${paciente.id}/medicamentos/${m.id}`}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              📸 Editar e Fotografar
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
