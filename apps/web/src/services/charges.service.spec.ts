import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Charge } from '@/types'

// Mock do módulo http — intercepta chamadas sem disparar axios real
vi.mock('@/services/http', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  unwrap: (res: { data: { data: unknown } }) => res.data.data,
}))

import http, { unwrap } from '@/services/http'
import { list, create } from '@/services/charges.service'

const mockGet = vi.mocked(http.get)
const mockPost = vi.mocked(http.post)

/** Fábrica de cobrança mínima para uso nos testes */
function makeCharge(overrides: Partial<Charge> = {}): Charge {
  return {
    id: 'chg_123',
    status: 'pending',
    amount: 10000,
    currency: 'BRL',
    customerId: 'cust_abc',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('list', () => {
  it('extrai items de res.data.data e total de res.data.meta.pagination.total', async () => {
    const charges = [makeCharge(), makeCharge({ id: 'chg_456' })]

    // Simula o envelope completo retornado pela API REST
    mockGet.mockResolvedValueOnce({
      data: {
        data: charges,
        meta: {
          pagination: { total: 42, page: 1, limit: 10, hasNext: true, hasPrev: false },
        },
      },
    })

    const result = await list(1, 10)

    expect(mockGet).toHaveBeenCalledWith('/charges', { params: { page: 1, limit: 10 } })
    expect(result.items).toEqual(charges)
    expect(result.total).toBe(42)
  })

  it('passa page e limit como query params', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [],
        meta: {
          pagination: { total: 0, page: 2, limit: 25, hasNext: false, hasPrev: true },
        },
      },
    })

    await list(2, 25)

    expect(mockGet).toHaveBeenCalledWith('/charges', { params: { page: 2, limit: 25 } })
  })
})

describe('create', () => {
  it('chama POST /charges e retorna a cobrança desempacotada', async () => {
    const newCharge = makeCharge({ id: 'chg_novo' })

    // Simula resposta da API após criação
    mockPost.mockResolvedValueOnce({
      data: { data: newCharge, meta: {} },
    })

    const dto = {
      customerId: 'cust_abc',
      amount: 10000,
      paymentMethod: 'pix',
      description: 'Cobrança de teste',
    }

    const result = await create(dto)

    expect(mockPost).toHaveBeenCalledWith('/charges', dto)
    expect(result).toEqual(newCharge)
  })

  it('não exige paymentLinkToken na resposta (Fase 2)', async () => {
    const chargeWithoutToken = makeCharge()
    // paymentLinkToken ausente — não deve quebrar o desempacotamento

    mockPost.mockResolvedValueOnce({
      data: { data: chargeWithoutToken, meta: {} },
    })

    const result = await create({
      customerId: 'cust_xyz',
      amount: 5000,
      paymentMethod: 'boleto',
    })

    expect(result).not.toHaveProperty('paymentLinkToken')
    expect(result.id).toBe(chargeWithoutToken.id)
  })
})

// Garante que unwrap foi mockado corretamente (smoke test)
describe('unwrap mock', () => {
  it('extrai res.data.data do envelope', () => {
    const fakeRes = { data: { data: { ok: true }, meta: {} } }
    expect(unwrap(fakeRes as never)).toEqual({ ok: true })
  })
})
