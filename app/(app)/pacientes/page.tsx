import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PacientesTable } from '@/components/modules/pacientes/pacientes-table'

interface Props {
  searchParams: { search?: string; page?: string }
}

export default async function PacientesPage({ searchParams }: Props) {
  const search = searchParams.search || ''
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20

  const where = search ? {
    OR: [
      { nome: { contains: search, mode: 'insensitive' as const } },
      { cpf: { contains: search.replace(/[^\d]/g, '') } },
    ]
  } : {}

  const [pacientes, total] = await Promise.all([
    prisma.paciente.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nome: 'asc' },
      include: {
        atendimentos: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.paciente.count({ where }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm">{total} paciente{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/pacientes/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Novo Paciente
        </Link>
      </div>

      <PacientesTable pacientes={pacientes} total={total} page={page} pageSize={pageSize} search={search} />
    </div>
  )
}
