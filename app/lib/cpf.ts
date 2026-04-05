export function validarCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false // sequências inválidas (000...0, 111...1)

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(10))) return false

  return true
}

export function formatarCPF(cpf: string): string {
  const c = cpf.replace(/\D/g, '').slice(0, 11)
  if (c.length <= 3) return c
  if (c.length <= 6) return `${c.slice(0, 3)}.${c.slice(3)}`
  if (c.length <= 9) return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6)}`
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`
}

export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}
