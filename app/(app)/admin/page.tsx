import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.perfil !== 'ADMINISTRADOR') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
        <p className="text-gray-500 text-sm">Gerenciamento do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/admin/usuarios', label: 'Usuários', desc: 'Gerenciar farmacêuticos e administradores' },
          { href: '/relatorios', label: 'Relatórios', desc: 'Indicadores e métricas do serviço' },
          { href: '/admin/configuracoes', label: 'Configurações', desc: 'Configurações do sistema' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 transition-colors">
            <h3 className="font-semibold text-gray-900">{item.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
