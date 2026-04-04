export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { callAIProvider, type AIProvider } from '@/lib/ai-providers'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { pacienteId, medicamentoId, tipo, provedor, modelo } = body

    if (!pacienteId || !medicamentoId || !tipo) {
      return NextResponse.json(
        { error: 'Paciente, medicamento e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar ownership do paciente
    const paciente = await prisma.paciente.findFirst({
      where: { id: pacienteId, usuarioId: session.user.id },
    })
    if (!paciente) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    const medicamento = await prisma.medicamento.findUnique({
      where: { id: medicamentoId },
    })
    if (!medicamento) {
      return NextResponse.json({ error: 'Medicamento não encontrado' }, { status: 404 })
    }

    // Resolver provider e API key
    const configIA = await prisma.configuracaoIA.findUnique({
      where: { usuarioId: session.user.id },
    })

    const provider: AIProvider = (provedor ?? configIA?.provedorPadrao ?? 'anthropic') as AIProvider
    const model: string = modelo ?? configIA?.modeloPadrao ?? 'claude-sonnet-4-6'

    let apiKey: string
    switch (provider) {
      case 'anthropic':
        apiKey = process.env.ANTHROPIC_API_KEY ?? ''
        if (!apiKey) {
          return NextResponse.json(
            { error: 'Chave Anthropic não configurada. Configure em Configurações > IA.' },
            { status: 400 }
          )
        }
        break
      case 'groq':
        apiKey = configIA?.groqApiKey ?? ''
        if (!apiKey) {
          return NextResponse.json(
            { error: 'Chave Groq não configurada. Adicione em Configurações > IA.' },
            { status: 400 }
          )
        }
        break
      case 'gemini':
        apiKey = configIA?.geminiApiKey ?? ''
        if (!apiKey) {
          return NextResponse.json(
            { error: 'Chave Gemini não configurada. Adicione em Configurações > IA.' },
            { status: 400 }
          )
        }
        break
      default:
        return NextResponse.json({ error: `Provider desconhecido: ${provider}` }, { status: 400 })
    }

    // Montar prompt
    const pacienteInfo = `
Nome: ${paciente.nome} ${paciente.sobrenome}
Idade: ${new Date().getFullYear() - new Date(paciente.dataNascimento).getFullYear()} anos
Gênero: ${paciente.genero}
Condições Clínicas: ${paciente.condicoes.join(', ') || 'Nenhuma registrada'}
Alergias: ${paciente.alergias.join(', ') || 'Nenhuma registrada'}
Medicações Atuais: ${paciente.medicacoes.join(', ') || 'Nenhuma registrada'}
    `.trim()

    const medicamentoInfo = `
Nome: ${medicamento.nome}
Princípio Ativo: ${medicamento.principioAtivo}
Dosagem: ${medicamento.dosagem}
Forma: ${medicamento.forma}
Fabricante: ${medicamento.fabricante || 'Não informado'}
Código ATC: ${medicamento.codigoATC || 'Não informado'}
    `.trim()

    const prompt = `Você é um farmacêutico especialista em análise farmacoterapêutica.

Analise a seguinte situação clínica e gere uma análise farmacoterapêutica completa:

PACIENTE:
${pacienteInfo}

MEDICAMENTO A ANALISAR:
${medicamentoInfo}

TIPO DE ANÁLISE SOLICITADA: ${tipo}

Responda APENAS com JSON válido no seguinte formato, sem texto adicional:
{
  "descricao": "Descrição completa e profissional da análise (2-3 parágrafos)",
  "achados": ["Achado 1", "Achado 2", "Achado 3"],
  "recomendacoes": ["Recomendação 1", "Recomendação 2", "Recomendação 3"]
}`

    // Chamar o provider selecionado
    const responseText = await callAIProvider({ provider, model, apiKey }, prompt, 1500)

    // Parse JSON da resposta
    let analysisData
    try {
      analysisData = JSON.parse(responseText)
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Não foi possível processar a resposta da IA')
      }
    }

    if (
      !analysisData.descricao ||
      !Array.isArray(analysisData.achados) ||
      !Array.isArray(analysisData.recomendacoes)
    ) {
      throw new Error('Resposta da IA em formato inválido')
    }

    const analise = await prisma.analiseFarmacoTerapeutica.create({
      data: {
        pacienteId,
        medicamentoId,
        tipo: `[${provider.toUpperCase()}/${model}] ${tipo}`,
        descricao: analysisData.descricao,
        achados: analysisData.achados,
        recomendacoes: analysisData.recomendacoes,
        status: 'concluida',
      },
      include: {
        paciente: { select: { id: true, nome: true, sobrenome: true } },
        medicamento: { select: { id: true, nome: true } },
      },
    })

    return NextResponse.json({ message: 'Análise gerada com sucesso', analise }, { status: 201 })
  } catch (error) {
    console.error('IA Analysis error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar análise'
    return NextResponse.json({ error: `Erro ao gerar análise: ${errorMessage}` }, { status: 500 })
  }
}
