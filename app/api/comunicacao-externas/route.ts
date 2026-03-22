import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const comunicacaoSchema = z.object({
  destinatario: z.string(),
  assunto: z.string(),
  mensagem: z.string(),
  pacienteId: z.string(),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = comunicacaoSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })

  // TODO: implement actual email/letter sending
  return NextResponse.json({ success: true, message: 'Comunicação registrada' }, { status: 201 })
}
