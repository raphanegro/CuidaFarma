import { Perfil, TipoAtendimento, NivelRisco } from '@prisma/client'

export type { Perfil, TipoAtendimento, NivelRisco }

export interface DashboardStats {
  totalPacientes: number
  totalAtendimentosMes: number
  totalPRMs: number
  intervencoeRealizadas: number
  intervencoesBemsucedidas: number
  alertas: Alerta[]
}

export interface Alerta {
  id: string
  tipo: 'INTERACAO' | 'DOSE_INADEQUADA' | 'EXAME_ALTERADO' | 'VENCIMENTO'
  mensagem: string
  pacienteId: string
  pacienteNome: string
  createdAt: Date
}

export interface SessionUser {
  id: string
  name: string
  email: string
  perfil: Perfil
}
