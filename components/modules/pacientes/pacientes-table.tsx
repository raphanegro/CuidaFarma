'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { formatarCPF, calcularIdade } from '@/lib/utils'

interface Props {
  pacientes: any[]
  total: number
  page: number
  pageSize: number
  search: string
}

export function PacientesTable({ pacientes, total, page, pageSize, search }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function handleSearch(value: string) {
    const params = new URLSearchParams()
    if (value) params.set('search', value)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Buscar por nome, CPF..."
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Idade</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Último Atendimento</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pacientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                  Nenhum paciente encontrado
                </td>
              </tr>
            ) : pacientes.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/pacientes/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                    {p.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatarCPF(p.cpf)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{calcularIdade(new Date(p.dataNascimento))} anos</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {p.atendimentos?.[0]
                    ? new Date(p.atendimentos[0].createdAt).toLocaleDateString('pt-BR')
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/pacientes/${p.id}/atendimento/novo`} className="text-xs text-blue-600 hover:underline">
                    Novo atendimento
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > pageSize && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Mostrando {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`${pathname}?${new URLSearchParams({ search, page: String(page - 1) }).toString()}`} className="px-3 py-1 border rounded hover:bg-gray-50">Anterior</Link>
              )}
              {page * pageSize < total && (
                <Link href={`${pathname}?${new URLSearchParams({ search, page: String(page + 1) }).toString()}`} className="px-3 py-1 border rounded hover:bg-gray-50">Próximo</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
