import http, { unwrap } from '@/services/http'
import type { ApiEnvelope } from '@/services/http'
import type { Invoice } from '@/types'
import type { AxiosResponse } from 'axios'

/**
 * Busca a fatura associada a um pagamento — GET /payments/:id/invoice
 * Retorna o objeto fatura desempacotado do envelope da API
 */
export async function getByPayment(paymentId: string): Promise<Invoice> {
  const res: AxiosResponse<ApiEnvelope<Invoice>> = await http.get(
    `/payments/${paymentId}/invoice`,
  )
  return unwrap(res)
}
