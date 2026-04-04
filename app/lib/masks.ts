/** Aplica máscara de telefone: (00) 00000-0000 ou (00) 0000-0000 */
export function formatarTelefone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) {
    // fixo: (00) 0000-0000
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  // celular: (00) 00000-0000
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

/** Aplica máscara de CEP: 00000-000 */
export function formatarCEP(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8)
  return d.replace(/(\d{5})(\d)/, '$1-$2')
}

/** Remove não-dígitos */
export function limpar(value: string): string {
  return value.replace(/\D/g, '')
}
