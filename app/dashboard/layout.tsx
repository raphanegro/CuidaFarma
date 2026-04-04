'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Pill,
  FileText,
  LogOut,
  Menu,
  X,
  Settings,
} from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',      href: '/dashboard' },
  { icon: Users,           label: 'Pacientes',      href: '/dashboard/pacientes' },
  { icon: Pill,            label: 'Medicamentos',   href: '/dashboard/medicamentos' },
  { icon: FileText,        label: 'Análises',       href: '/dashboard/analises' },
  { icon: Settings,        label: 'Configurações',  href: '/dashboard/configuracoes' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-4 border-gray-300 border-t-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar desktop */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 hidden lg:flex flex-col`}>
        <div className="p-6 border-b border-gray-800">
          <h1 className={`font-bold text-xl ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? 'CuidaFarma' : 'CF'}
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {session.user?.name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{session.user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
            className="mt-4 w-full flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && 'Sair'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
              <p className="text-xs text-gray-500">
                {session.user?.role === 'ADMIN' ? 'Administrador' : 'Farmacêutico'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
              {session.user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h1 className="font-bold text-xl">CuidaFarma</h1>
              <button onClick={() => setMobileMenuOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <nav className="px-4 py-6">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </div>
  )
}
