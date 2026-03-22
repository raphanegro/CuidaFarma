import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function NotificacoesPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id

  const notificacoes = await prisma.notificacao.findMany({
    where: { usuarioId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <p className="text-gray-500 text-sm">{notificacoes.filter(n => !n.lida).length} não lidas</p>
      </div>

      <div className="space-y-3">
        {notificacoes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhuma notificação</div>
        ) : notificacoes.map((n) => (
          <div key={n.id} className={`bg-white rounded-xl border p-4 ${!n.lida ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
            <p className="font-medium text-gray-900">{n.titulo}</p>
            <p className="text-sm text-gray-600 mt-1">{n.mensagem}</p>
            <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
