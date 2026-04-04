export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/configuracoes/ia
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const config = await prisma.configuracaoIA.findUnique({
    where: { usuarioId: session.user.id },
    select: {
      provedorPadrao: true,
      modeloPadrao: true,
      groqApiKey: true,
      geminiApiKey: true,
    },
  })

  if (!config) {
    return NextResponse.json({
      provedorPadrao: 'anthropic',
      modeloPadrao: 'claude-sonnet-4-6',
      groqApiKey: null,
      geminiApiKey: null,
    })
  }

  // Mascarar chaves — retorna apenas os últimos 4 chars
  return NextResponse.json({
    provedorPadrao: config.provedorPadrao,
    modeloPadrao: config.modeloPadrao,
    groqApiKey: config.groqApiKey ? maskKey(config.groqApiKey) : null,
    geminiApiKey: config.geminiApiKey ? maskKey(config.geminiApiKey) : null,
    temGroq: !!config.groqApiKey,
    temGemini: !!config.geminiApiKey,
  })
}

// PUT /api/configuracoes/ia
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { provedorPadrao, modeloPadrao, groqApiKey, geminiApiKey } = body

  // Buscar config atual para manter chaves que não foram enviadas
  const existing = await prisma.configuracaoIA.findUnique({
    where: { usuarioId: session.user.id },
  })

  const data = {
    provedorPadrao: provedorPadrao ?? existing?.provedorPadrao ?? 'anthropic',
    modeloPadrao: modeloPadrao ?? existing?.modeloPadrao ?? 'claude-sonnet-4-6',
    // Só atualiza a chave se vier uma nova (não mascarada)
    groqApiKey: isNewKey(groqApiKey) ? groqApiKey : (existing?.groqApiKey ?? null),
    geminiApiKey: isNewKey(geminiApiKey) ? geminiApiKey : (existing?.geminiApiKey ?? null),
  }

  const config = await prisma.configuracaoIA.upsert({
    where: { usuarioId: session.user.id },
    create: { usuarioId: session.user.id, ...data },
    update: data,
    select: { provedorPadrao: true, modeloPadrao: true },
  })

  return NextResponse.json({ message: 'Configurações salvas', ...config })
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return '••••••••••••' + key.slice(-4)
}

// Verifica se é uma chave nova (não mascarada) ou vazia (limpar)
function isNewKey(value: unknown): boolean {
  if (value === null || value === '') return true  // limpar chave
  if (typeof value !== 'string') return false
  return !value.includes('•')  // mascarada = não atualizar
}
