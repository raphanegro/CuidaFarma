export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const where = session.user.role === 'ADMIN' ? {} : { usuarioId: session.user.id }

  const pacientes = await prisma.paciente.findMany({
    where: { ...where, ativo: true },
    select: {
      nome: true,
      sobrenome: true,
      cpf: true,
      dataNascimento: true,
      genero: true,
      telefone: true,
      email: true,
      unidadeSaude: true,
      criadoEm: true,
    },
    orderBy: [{ nome: 'asc' }, { sobrenome: 'asc' }],
  })

  const header = 'Nome,Sobrenome,CPF,Data Nascimento,Gênero,Telefone,Email,Unidade de Saúde,Cadastrado em\n'
  const rows = pacientes.map((p) => [
    p.nome,
    p.sobrenome,
    p.cpf,
    new Date(p.dataNascimento).toLocaleDateString('pt-BR'),
    p.genero === 'M' ? 'Masculino' : p.genero === 'F' ? 'Feminino' : 'Outro',
    p.telefone ?? '',
    p.email ?? '',
    p.unidadeSaude ?? '',
    new Date(p.criadoEm).toLocaleDateString('pt-BR'),
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))

  const csv = header + rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pacientes-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
