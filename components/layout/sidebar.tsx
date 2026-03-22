'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Pill,
  Bell,
  BarChart3,
  Settings,
  ClipboardList,
} from 'lucide-react'

interface SidebarProps {
  perfil: 'FARMACEUTICO' | 'ADMINISTRADOR'
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['FARMACEUTICO', 'ADMINISTRADOR'] },
  { href: '/pacientes', label: 'Pacientes', icon: Users, roles: ['FARMACEUTICO', 'ADMINISTRADOR'] },
  { href: '/medicamentos', label: 'Medicamentos', icon: Pill, roles: ['FARMACEUTICO'] },
  { href: '/atendimentos', label: 'Atendimentos', icon: ClipboardList, roles: ['FARMACEUTICO'] },
  { href: '/notificacoes', label: 'Notificações', icon: Bell, roles: ['FARMACEUTICO', 'ADMINISTRADOR'] },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3, roles: ['ADMINISTRADOR'] },
  { href: '/admin', label: 'Administração', icon: Settings, roles: ['ADMINISTRADOR'] },
]

export function Sidebar({ perfil }: SidebarProps) {
  const pathname = usePathname()

  const filteredItems = navItems.filter(item => item.roles.includes(perfil))

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">CF</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">CuidaFarma</p>
            <p className="text-xs text-gray-500">Cuidado Farmacêutico</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
