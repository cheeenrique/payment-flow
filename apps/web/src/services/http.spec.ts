import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { AxiosResponse } from 'axios'
import type { ApiEnvelope } from '@/services/http'
import { unwrap, applyJwtHeader } from '@/services/http'
import type { InternalAxiosRequestConfig } from 'axios'

// Tipagem auxiliar para montar respostas fake sem precisar de todos os campos do AxiosResponse
type FakeResponse<T> = Pick<AxiosResponse<ApiEnvelope<T>>, 'data'>

describe('unwrap', () => {
  it('extrai data do envelope { data, meta }', () => {
    const response: FakeResponse<{ x: number }> = {
      data: { data: { x: 1 }, meta: {} },
    }

    // Forçamos o cast pois só precisamos de .data para o unwrap funcionar
    const result = unwrap(response as AxiosResponse<ApiEnvelope<{ x: number }>>)

    expect(result).toEqual({ x: 1 })
  })

  it('preserva o tipo genérico T ao extrair', () => {
    type Payment = { id: string; amount: number }

    const response: FakeResponse<Payment> = {
      data: { data: { id: 'pay_001', amount: 9900 }, meta: { page: 1 } },
    }

    const result = unwrap(response as AxiosResponse<ApiEnvelope<Payment>>)

    expect(result).toStrictEqual({ id: 'pay_001', amount: 9900 })
  })
})

describe('applyJwtHeader', () => {
  // Mock de localStorage para evitar dependência da implementação do jsdom
  let store: Record<string, string> = {}

  const localStorageMock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('injeta Authorization Bearer quando accessToken existe no localStorage', () => {
    localStorageMock.setItem('accessToken', 'token-secreto')

    const config = { headers: {} } as InternalAxiosRequestConfig
    const result = applyJwtHeader(config)

    expect(result.headers['Authorization']).toBe('Bearer token-secreto')
  })

  it('não adiciona Authorization quando accessToken está ausente', () => {
    const config = { headers: {} } as InternalAxiosRequestConfig
    const result = applyJwtHeader(config)

    expect(result.headers['Authorization']).toBeUndefined()
  })
})
