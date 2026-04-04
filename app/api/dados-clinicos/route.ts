export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

function calcularIMC(peso: number, altura: number): { imc: number; classificacao: string } {
  const imc = peso / (altura * altura)
  let classificacao = ''

  if (imc < 18.5) classificacao = 'Abaixo do peso'
  else if (imc < 25) classificacao = 'Peso normal'
  else if (imc < 30) classificacao = 'Sobrepeso'
  else if (imc < 35) classificacao = 'Obesidade grau I'
  else if (imc < 40) classificacao = 'Obesidade grau II'
  else classificacao = 'Obesidade grau III'

  return { imc: Math.round(imc * 100) / 100, classificacao }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.atendimentoId) {
      return NextResponse.json({ error: 'atendimentoId é obrigatório' }, { status: 400 })
    }

    // Verificar que atendimento pertence ao usuário
    const atendimento = await prisma.atendimento.findFirst({
      where: { id: body.atendimentoId, usuarioId: session.user.id },
    })
    if (!atendimento) {
      return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 })
    }

    // Calcular IMC se peso e altura informados
    let imcCalculado: number | undefined
    let classificacaoImc: string | undefined

    const peso = body.peso ? parseFloat(body.peso) : undefined
    const altura = body.altura ? parseFloat(body.altura) : undefined

    if (peso !== undefined && (isNaN(peso) || peso <= 0 || peso > 500)) {
      return NextResponse.json({ error: 'Peso inválido (0–500 kg)' }, { status: 400 })
    }
    if (altura !== undefined && (isNaN(altura) || altura <= 0 || altura > 3)) {
      return NextResponse.json({ error: 'Altura inválida (0–3 m)' }, { status: 400 })
    }

    if (peso && altura && altura > 0) {
      const result = calcularIMC(peso, altura)
      imcCalculado = result.imc
      classificacaoImc = result.classificacao
    }

    const dadosClinicos = await prisma.dadosClinicos.upsert({
      where: { atendimentoId: body.atendimentoId },
      create: {
        atendimentoId: body.atendimentoId,
        peso: peso ?? null,
        altura: altura ?? null,
        imc: imcCalculado ?? null,
        classificacaoImc: classificacaoImc ?? null,
        paSistolica: body.paSistolica ? parseInt(body.paSistolica) : null,
        paDiastolica: body.paDiastolica ? parseInt(body.paDiastolica) : null,
        freqCardiaca: body.freqCardiaca ? parseInt(body.freqCardiaca) : null,
        glicemiaCapilar: body.glicemiaCapilar ? parseFloat(body.glicemiaCapilar) : null,
      },
      update: {
        peso: peso ?? null,
        altura: altura ?? null,
        imc: imcCalculado ?? null,
        classificacaoImc: classificacaoImc ?? null,
        paSistolica: body.paSistolica ? parseInt(body.paSistolica) : null,
        paDiastolica: body.paDiastolica ? parseInt(body.paDiastolica) : null,
        freqCardiaca: body.freqCardiaca ? parseInt(body.freqCardiaca) : null,
        glicemiaCapilar: body.glicemiaCapilar ? parseFloat(body.glicemiaCapilar) : null,
      },
    })

    return NextResponse.json(dadosClinicos, { status: 201 })
  } catch (error) {
    console.error('DadosClinicos POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
