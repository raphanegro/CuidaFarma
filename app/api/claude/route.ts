export const dynamic = 'force-dynamic'

import { Anthropic } from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { message } = body

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
  }

  if (message.length > 10000) {
    return NextResponse.json({ error: 'Mensagem muito longa' }, { status: 400 })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: message.trim() }],
  })

  return NextResponse.json(response)
}