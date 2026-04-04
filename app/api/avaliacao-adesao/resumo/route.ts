import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth'
import { prisma } from '@/app/lib/prisma'

// GET /api/avaliacao-adesao/resumo?pacienteId= — última taxa por medicamento
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('pacienteId')

  if (!pacienteId) {
    return NextResponse.json({ error: 'pacienteId obrigatório' }, { status: 400 })
  }

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, usuarioId: session.user.id },
    select: { id: true },
  })
  if (!paciente) {
    return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
  }

  // Última avaliação por medicamento
  const avaliacoes = await prisma.avaliacaoAdesao.findMany({
    where: { pacienteId },
    include: {
      medicamentoEmUso: {
        select: { id: true, nomeCustom: true, medicamento: { select: { nome: true } } },
      },
    },
    orderBy: { criadoEm: 'desc' },
  })

  // Deduplica: mantém apenas a mais recente por medicamentoEmUsoId
  const vistos = new Set<string>()
  const resumo = avaliacoes.filter((a) => {
    if (vistos.has(a.medicamentoEmUsoId)) return false
    vistos.add(a.medicamentoEmUsoId)
    return true
  })

  return NextResponse.json(resumo)
}
