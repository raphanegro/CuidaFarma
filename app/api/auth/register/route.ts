import { prisma } from '@/lib/prisma'
import { validarCPF, limparCPF } from '@/lib/cpf'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, sobrenome, email, cpf, senha } = body

    // Validações
    if (!nome || !sobrenome || !email || !cpf || !senha) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Email inválido' }, { status: 400 })
    }

    if (senha.length < 8) {
      return NextResponse.json({ message: 'A senha deve ter no mínimo 8 caracteres' }, { status: 400 })
    }

    const cpfLimpo = limparCPF(cpf)
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ message: 'CPF inválido' }, { status: 400 })
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email já está registrado' },
        { status: 400 }
      )
    }

    // Verificar CPF duplicado
    const existingCPF = await prisma.usuario.findUnique({
      where: { cpf: cpfLimpo },
    })

    if (existingCPF) {
      return NextResponse.json(
        { message: 'Este CPF já está registrado' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10)

    // Criar usuário
    const user = await prisma.usuario.create({
      data: {
        nome,
        sobrenome,
        email,
        cpf: cpfLimpo,
        senha: hashedPassword,
        role: 'PHARMACIST',
      },
    })

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso',
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { message: 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
