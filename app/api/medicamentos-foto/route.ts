import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const fotoSchema = z.object({
  medicamentoId: z.string(),
  foto: z.string(), // base64 encoded image
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const result = fotoSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })

    const { medicamentoId, foto } = result.data

    // Validate that medicamento exists
    const medicamento = await prisma.medicamentoUso.findUnique({
      where: { id: medicamentoId },
    })

    if (!medicamento) {
      return NextResponse.json({ error: 'Medicamento não encontrado' }, { status: 404 })
    }

    // Update medicamento with foto
    const updated = await prisma.medicamentoUso.update({
      where: { id: medicamentoId },
      data: { fotografia: foto },
    })

    return NextResponse.json({ success: true, medicamento: updated }, { status: 200 })
  } catch (error) {
    console.error('Erro ao salvar foto:', error)
    return NextResponse.json({ error: 'Erro ao salvar foto' }, { status: 500 })
  }
}
