import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: 'ADMIN' | 'PHARMACIST'
  }

  interface Session {
    user: User & {
      id: string
      role: 'ADMIN' | 'PHARMACIST'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'ADMIN' | 'PHARMACIST'
  }
}
