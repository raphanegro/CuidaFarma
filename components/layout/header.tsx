'use client'

import { signOut } from 'next-auth/react'
import { Bell, LogOut, User } from 'lucide-react'

interface HeaderProps {
  user: {
    name?: string
    email?: string
    perfil?: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:text-gray-700 relative">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Farmacêutico'}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-gray-500 hover:text-gray-700"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
