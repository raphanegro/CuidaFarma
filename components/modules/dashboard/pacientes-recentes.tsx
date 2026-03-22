import Link from 'next/link'
import { formatarCPF } from '@/lib/utils'

interface Props {
  pacientes: any[]
}

export function PacientesRecentes({ pacientes }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Pacientes Recentes</h3>
        <Link href="/pacientes" className="text-blue-600 text-sm hover:underline">Ver todos</Link>
      </div>

      {pacientes.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Nenhum paciente cadastrado</div>
      ) : (
        <div className="space-y-3">
          {pacientes.map((p) => (
            <Link key={p.id} href={`/pacientes/${p.id}`} className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{p.nome}</p>
                <p className="text-xs text-gray-500">{formatarCPF(p.cpf)}</p>
              </div>
              <span className="text-xs text-gray-400">{new Date(p.updatedAt).toLocaleDateString('pt-BR')}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
