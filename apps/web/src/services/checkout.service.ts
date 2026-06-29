import http, { unwrap } from '@/services/http'
import type { ApiEnvelope } from '@/services/http'
import type { CheckoutView, PaymentMethod } from '@/types'
import type { AxiosResponse } from 'axios'

/**
 * Busca a visão pública de uma cobrança pelo token — GET /pay/:token
 * Não requer JWT; rota pública do checkout.
 */
export async function getByToken(token: string): Promise<CheckoutView> {
  const res: AxiosResponse<ApiEnvelope<CheckoutView>> = await http.get(`/pay/${token}`)
  return unwrap(res)
}

/**
 * Confirma o método de pagamento escolhido — POST /pay/:token/confirm
 * Retorna void; descarta o envelope da API.
 */
export async function confirm(token: string, method: PaymentMethod): Promise<void> {
  const res: AxiosResponse<ApiEnvelope<unknown>> = await http.post(`/pay/${token}/confirm`, {
    method,
  })
  unwrap(res)
}

/**
 * Retorna a URL do SSE stream de status para o token informado.
 * Síncrono — apenas concatena VITE_API_URL com o caminho do recurso.
 */
export function streamUrl(token: string): string {
  return `${import.meta.env.VITE_API_URL}/pay/${token}/stream`
}
