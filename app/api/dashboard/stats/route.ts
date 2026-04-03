import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Se for pharmacist, mostrar apenas seus pacientes
    const userId = session.user.id

    const [totalPacientes, totalMedicamentos, totalAnalises, intervencoesPendentes] =
      await Promise.all([
        prisma.paciente.count({
          where: { usuarioId: userId },
        }),
        prisma.medicamento.count(),
        prisma.analiseFarmacoTerapeutica.count({
          where: {
            paciente: {
              usuarioId: userId,
            },
          },
        }),
        prisma.intervencao.count({
          where: {
            status: 'PENDING',
            paciente: {
              usuarioId: userId,
            },
          },
        }),
      ])

    return NextResponse.json({
      totalPacientes,
      totalMedicamentos,
      totalAnalises,
      intervencoesPendentes,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
