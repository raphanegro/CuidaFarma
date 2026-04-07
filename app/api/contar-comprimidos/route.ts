import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('imagem') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Imagem não enviada' }, { status: 400 })
  }

  const maxBytes = 5 * 1024 * 1024 // 5 MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: 'Imagem muito grande (máximo 5 MB)' }, { status: 400 })
  }

  const tipo = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(tipo)) {
    return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WEBP.' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: tipo, data: base64 },
          },
          {
            type: 'text',
            text: `Conte o número de comprimidos, cápsulas ou sachês visíveis nesta imagem.
Responda APENAS com um objeto JSON no formato: {"quantidade": <número inteiro>, "confianca": "<alta|media|baixa>", "observacao": "<texto curto opcional>"}
Não inclua nenhum texto fora do JSON.
Se não for possível identificar medicamentos na imagem, retorne: {"quantidade": 0, "confianca": "baixa", "observacao": "Não foram identificados comprimidos na imagem"}`,
          },
        ],
      },
    ],
  })

  const texto = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  try {
    const resultado = JSON.parse(texto)
    return NextResponse.json({
      quantidade: Number(resultado.quantidade) || 0,
      confianca: resultado.confianca || 'baixa',
      observacao: resultado.observacao || null,
    })
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível interpretar a resposta da IA' },
      { status: 500 }
    )
  }
}
