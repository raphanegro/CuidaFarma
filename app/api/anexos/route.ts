export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, LIMITE_ARQUIVOS, LIMITE_BYTES } from '@/lib/file-storage'

async function verificarOwnership(pacienteId: string, usuarioId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    select: { usuarioId: true },
  })
  return paciente?.usuarioId === usuarioId
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pacienteId = request.nextUrl.searchParams.get('pacienteId')
  if (!pacienteId) return NextResponse.json({ error: 'pacienteId required' }, { status: 400 })

  // ALTO-08: validar ownership do paciente
  const autorizado = await verificarOwnership(pacienteId, session.user.id, session.user.role === 'ADMIN')
  if (!autorizado) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const anexos = await prisma.anexo.findMany({
    where: { pacienteId },
    orderBy: { criadoEm: 'desc' },
  })
  return NextResponse.json(anexos)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const pacienteId = formData.get('pacienteId') as string
  const tipo = formData.get('tipo') as string
  const descricao = formData.get('descricao') as string | null

  if (!file || !pacienteId || !tipo) {
    return NextResponse.json({ error: 'file, pacienteId e tipo sao obrigatorios' }, { status: 400 })
  }

  // MEDIO-04: validar ownership do paciente no upload
  const autorizado = await verificarOwnership(pacienteId, session.user.id, session.user.role === 'ADMIN')
  if (!autorizado) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo nao permitido. Use PDF, JPG ou PNG.' }, { status: 400 })
  }

  if (file.size > LIMITE_BYTES) {
    return NextResponse.json({ error: `Arquivo muito grande. Maximo ${20}MB.` }, { status: 400 })
  }

  const totalAnexos = await prisma.anexo.count({ where: { pacienteId } })
  if (totalAnexos >= LIMITE_ARQUIVOS) {
    return NextResponse.json({ error: `Limite de ${LIMITE_ARQUIVOS} arquivos por paciente atingido.` }, { status: 400 })
  }

  const somaTamanhos = await prisma.anexo.aggregate({
    where: { pacienteId },
    _sum: { tamanho: true },
  })
  const usadoBytes = somaTamanhos._sum.tamanho ?? 0
  if (usadoBytes + file.size > LIMITE_BYTES * LIMITE_ARQUIVOS) {
    return NextResponse.json({ error: 'Limite de armazenamento do paciente atingido.' }, { status: 400 })
  }

  const { url, size } = await uploadFile(file, pacienteId)

  const anexo = await prisma.anexo.create({
    data: {
      nome: file.name,
      tipo,
      url,
      tamanho: size,
      descricao: descricao || null,
      pacienteId,
    },
  })

  return NextResponse.json(anexo, { status: 201 })
}
