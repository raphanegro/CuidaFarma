import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 60 },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Login', type: 'text' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.senha) return null

        const usuario = await prisma.usuario.findUnique({
          where: { login: credentials.login, ativo: true },
        })

        if (!usuario) return null

        const senhaValida = await bcrypt.compare(credentials.senha, usuario.senha)
        if (!senhaValida) return null

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.login,
          perfil: usuario.perfil,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.perfil = (user as any).perfil
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub
        ;(session.user as any).perfil = token.perfil
      }
      return session
    },
  },
}
