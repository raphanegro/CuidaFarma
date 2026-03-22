import { z } from 'zod'

export const pacienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  sexo: z.enum(['M', 'F', 'OUTRO'], { required_error: 'Sexo é obrigatório' }),
  telefone: z.string().min(10, 'Telefone inválido'),
  endereco: z.string().optional(),
  unidadeSaude: z.string().optional(),
  profissionalResponsavel: z.string().optional(),
})

export type PacienteForm = z.infer<typeof pacienteSchema>
