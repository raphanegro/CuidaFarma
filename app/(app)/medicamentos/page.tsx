import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function MedicamentosPage() {
  const medicamentos = await prisma.medicamentoUso.findMany({
    where: { ativo: true },
    orderBy: { nomeGenerico: 'asc' },
    include: { paciente: true },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medicamentos em Uso</h1>
        <p className="text-gray-500 text-sm">{medicamentos.length} medicamentos ativos</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Medicamento</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dose</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Frequência</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paciente</th>
            </tr>
          </thead>
          <tbody>
            {medicamentos.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400">Nenhum medicamento cadastrado</td></tr>
            ) : medicamentos.map((m) => (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{m.nomeGenerico}</td>
                <td className="px-4 py-3 text-gray-600">{m.dose}</td>
                <td className="px-4 py-3 text-gray-600">{m.frequencia}</td>
                <td className="px-4 py-3">
                  <Link href={`/pacientes/${m.pacienteId}`} className="text-blue-600 hover:underline">{m.paciente.nome}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
