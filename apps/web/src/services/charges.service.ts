import http, { unwrap } from '@/services/http'
import type { ApiEnvelope } from '@/services/http'
import type { Charge, CreateChargeDto } from '@/types'
import type { AxiosResponse } from 'axios'

/** Envelope de paginação retornado em GET /charges */
interface PaginationMeta {
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

interface ChargesListMeta {
  pagination: PaginationMeta
}

/** Resultado de listagem com itens e total de registros */
interface ChargesListResult {
  items: Charge[]
  total: number
}

/**
 * Busca cobranças paginadas — GET /charges?page=&limit=
 * Não usa unwrap pois precisa de res.data.meta.pagination.total além de res.data.data
 */
export async function list(page: number, limit: number): Promise<ChargesListResult> {
  const res: AxiosResponse<{ data: Charge[]; meta: ChargesListMeta }> = await http.get(
    '/charges',
    { params: { page, limit } },
  )

  return {
    items: res.data.data,
    total: res.data.meta.pagination.total,
  }
}

/**
 * Cria uma nova cobrança — POST /charges
 * Retorna o objeto cobrança desempacotado do envelope da API
 */
export async function create(dto: CreateChargeDto): Promise<Charge> {
  const res: AxiosResponse<ApiEnvelope<Charge>> = await http.post('/charges', dto)
  return unwrap(res)
}
