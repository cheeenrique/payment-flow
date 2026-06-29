/**
 * Formata valor em centavos para moeda brasileira.
 * Exemplo: 10000 → R$ 100,00
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

/**
 * Formata string ISO 8601 para data no formato local pt-BR.
 * Exemplo: "2024-01-15T10:30:00Z" → "15/01/2024"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

/**
 * Formata string ISO 8601 para data e hora no formato local pt-BR.
 * Exemplo: "2024-01-15T10:30:00Z" → "15/01/2024, 10:30:00"
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}
