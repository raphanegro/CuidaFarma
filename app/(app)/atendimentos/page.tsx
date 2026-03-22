import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const tipoLabels: Record<string, string> = {
  CONSULTA_UBS: 'Consulta na UBS',
  CONSULTORIO_FARMACEUTICO: 'Consultório Farmacêutico',
  VISITA_DOMICILIAR: 'Visita Domiciliar',
  TELEATENDIMENTO: 'Teleatendimento',
}

export default async function AtendimentosPage() {
  const atendimentos = await prisma.atendimento.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { paciente: true, usuario: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Atendimentos</h1>
        <p className="text-gray-500 text-sm">{atendimentos.length} atendimentos recentes</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paciente</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Farmacêutico</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
            </tr>
          </thead>
          <tbody>
            {atendimentos.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400">Nenhum atendimento registrado</td></tr>
            ) : atendimentos.map((a) => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/pacientes/${a.pacienteId}`} className="font-medium text-blue-600 hover:underline">{a.paciente.nome}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{tipoLabels[a.tipoAtendimento] || a.tipoAtendimento}</td>
                <td className="px-4 py-3 text-gray-600">{a.usuario.nome}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(a.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
