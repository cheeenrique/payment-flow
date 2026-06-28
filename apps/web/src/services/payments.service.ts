import http from '@/services/http'
import type { AxiosResponse } from 'axios'
import type { Payment } from '@/types'

/** Envelope de paginação retornado em GET /charges/:chargeId/payments */
interface PaginationMeta {
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

interface PaymentsListMeta {
  pagination: PaginationMeta
}

/** Resultado de listagem com itens e total de registros */
interface PaymentsListResult {
  items: Payment[]
  total: number
}

/**
 * Busca pagamentos paginados de uma cobrança — GET /charges/:chargeId/payments?page=&limit=
 * Não usa unwrap pois precisa de res.data.meta.pagination.total além de res.data.data
 */
export async function listByCharge(
  chargeId: string,
  page: number,
  limit: number,
): Promise<PaymentsListResult> {
  const res: AxiosResponse<{ data: Payment[]; meta: PaymentsListMeta }> = await http.get(
    `/charges/${chargeId}/payments`,
    { params: { page, limit } },
  )

  return {
    items: res.data.data,
    total: res.data.meta.pagination.total,
  }
}
