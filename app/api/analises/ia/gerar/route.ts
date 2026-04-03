import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Chave da API Claude não configurada' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { pacienteId, medicamentoId, tipo } = body

    // Validações
    if (!pacienteId || !medicamentoId || !tipo) {
      return NextResponse.json(
        { error: 'Paciente, medicamento e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar dados do paciente
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
    })

    if (!paciente) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    // Buscar dados do medicamento
    const medicamento = await prisma.medicamento.findUnique({
      where: { id: medicamentoId },
    })

    if (!medicamento) {
      return NextResponse.json(
        { error: 'Medicamento não encontrado' },
        { status: 404 }
      )
    }

    // Preparar contexto para Claude
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

    const prompt = `
Você é um farmacêutico especialista em análise farmacoterapêutica.

Analise a seguinte situação clínica e gere uma análise farmacoterapêutica completa:

PACIENTE:
${pacienteInfo}

MEDICAMENTO A ANALISAR:
${medicamentoInfo}

TIPO DE ANÁLISE SOLICITADA: ${tipo}

Por favor, forneça uma resposta estruturada em formato JSON com os seguintes campos:
1. "descricao": Uma descrição completa e profissional da análise (2-3 parágrafos)
2. "achados": Uma lista de 3-5 achados relevantes (array de strings)
3. "recomendacoes": Uma lista de 3-5 recomendações ou observações (array de strings)

Exemplo de resposta esperada:
{
  "descricao": "Análise de segurança e efetividade do medicamento para o perfil clínico do paciente...",
  "achados": ["Achado 1", "Achado 2", "Achado 3"],
  "recomendacoes": ["Recomendação 1", "Recomendação 2", "Recomendação 3"]
}

IMPORTANTE: Responda APENAS com JSON válido, sem texto adicional.
    `.trim()

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extrair conteúdo da resposta
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON da resposta
    let analysisData
    try {
      analysisData = JSON.parse(responseText)
    } catch (e) {
      // Se não conseguir fazer parse, tenta extrair JSON do texto
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Não foi possível processar a resposta da IA')
      }
    }

    // Validar estrutura da resposta
    if (
      !analysisData.descricao ||
      !Array.isArray(analysisData.achados) ||
      !Array.isArray(analysisData.recomendacoes)
    ) {
      throw new Error('Resposta da IA em formato inválido')
    }

    // Criar análise no banco de dados
    const analise = await prisma.analiseFarmacoTerapeutica.create({
      data: {
        pacienteId,
        medicamentoId,
        tipo,
        descricao: analysisData.descricao,
        achados: analysisData.achados,
        recomendacoes: analysisData.recomendacoes,
        status: 'concluida',
      },
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            sobrenome: true,
          }
        },
        medicamento: {
          select: {
            id: true,
            nome: true,
          }
        }
      }
    })

    return NextResponse.json(
      {
        message: 'Análise gerada com sucesso pela IA',
        analise,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('IA Analysis error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Erro ao gerar análise'
    return NextResponse.json(
      { error: `Erro ao gerar análise: ${errorMessage}` },
      { status: 500 }
    )
  }
}
