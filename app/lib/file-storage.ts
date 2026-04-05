import { put, del } from '@vercel/blob'

export async function uploadFile(
  file: File,
  pacienteId: string
): Promise<{ url: string; size: number }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const filename = `pacientes/${pacienteId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const blob = await put(filename, file, {
    access: 'public',
    contentType: file.type,
  })

  return { url: blob.url, size: file.size }
}

export async function deleteFile(url: string): Promise<void> {
  try {
    await del(url)
  } catch {
    // silently ignore if already deleted
  }
}

export const TIPOS_DOCUMENTO = [
  'Receita Médica',
  'Exame Laboratorial',
  'Diário Glicêmico',
  'MRPA',
  'Organizador de Medicamentos',
  'Outros',
] as const

export const LIMITE_ARQUIVOS = 10
export const LIMITE_MB = 20
export const LIMITE_BYTES = LIMITE_MB * 1024 * 1024
