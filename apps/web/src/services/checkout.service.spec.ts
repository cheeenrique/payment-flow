import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CheckoutView } from '@/types'

// Mock do módulo http — intercepta chamadas sem disparar axios real
vi.mock('@/services/http', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  unwrap: (res: { data: { data: unknown } }) => res.data.data,
}))

import http from '@/services/http'
import { getByToken, confirm, streamUrl } from '@/services/checkout.service'

const mockGet = vi.mocked(http.get)
const mockPost = vi.mocked(http.post)

/** Fábrica de CheckoutView mínima para uso nos testes */
function makeCheckoutView(overrides: Partial<CheckoutView> = {}): CheckoutView {
  return {
    amount: 10000,
    currency: 'BRL',
    status: 'pending',
    availableMethods: ['pix', 'boleto'],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getByToken', () => {
  it('chama GET /pay/:token com a URL correta', async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: makeCheckoutView(), meta: {} },
    })

    await getByToken('tok_abc123')

    expect(mockGet).toHaveBeenCalledWith('/pay/tok_abc123')
  })

  it('desempacota e retorna o CheckoutView do envelope', async () => {
    const view = makeCheckoutView({
      description: 'Cobrança de teste',
    })

    mockGet.mockResolvedValueOnce({
      data: { data: view, meta: {} },
    })

    const result = await getByToken('tok_abc123')

    expect(result).toEqual(view)
  })

  it('propaga erro quando GET falha', async () => {
    const networkError = new Error('Network Error')
    mockGet.mockRejectedValueOnce(networkError)

    await expect(getByToken('tok_abc123')).rejects.toThrow('Network Error')
  })
})

describe('confirm', () => {
  it('chama POST /pay/:token/confirm com body { method }', async () => {
    mockPost.mockResolvedValueOnce({
      data: { data: null, meta: {} },
    })

    await confirm('tok_abc123', 'pix')

    expect(mockPost).toHaveBeenCalledWith('/pay/tok_abc123/confirm', { method: 'pix' })
  })

  it('resolve como void quando o POST bem-sucedido', async () => {
    mockPost.mockResolvedValueOnce({
      data: { data: null, meta: {} },
    })

    const result = await confirm('tok_abc123', 'pix')

    expect(result).toBeUndefined()
  })

  it('propaga erro quando POST falha', async () => {
    const serverError = new Error('Internal Server Error')
    mockPost.mockRejectedValueOnce(serverError)

    await expect(confirm('tok_abc123', 'pix')).rejects.toThrow('Internal Server Error')
  })
})

describe('streamUrl', () => {
  it('retorna URL concreta com o token informado', () => {
    vi.stubEnv('VITE_API_URL', 'http://api.example.com')

    const url = streamUrl('tok_abc123')

    expect(url).toBe('http://api.example.com/pay/tok_abc123/stream')

    vi.unstubAllEnvs()
  })
})
