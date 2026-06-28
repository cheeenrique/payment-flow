import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import * as authService from '@/services/auth.service'

// Mock completo do módulo de serviço — não toca no cliente http real
vi.mock('@/services/auth.service')

describe('auth.store', () => {
  // Simulação isolada do localStorage para não contaminar outros testes
  let localStorageStore: Record<string, string> = {}

  const localStorageMock = {
    getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageStore[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageStore[key]
    }),
    clear: vi.fn(() => {
      localStorageStore = {}
    }),
  }

  beforeEach(() => {
    localStorageStore = {}
    vi.stubGlobal('localStorage', localStorageMock)
    // Cria instância fresca do Pinia a cada teste para evitar vazamento de estado
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('chama postLogin com email e senha corretos', async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        roles: [],
        permissions: [],
      })

      const store = useAuthStore()
      await store.login('user@test.com', 'senha123')

      expect(authService.postLogin).toHaveBeenCalledWith('user@test.com', 'senha123')
    })

    it('salva accessToken no localStorage após login bem-sucedido', async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        roles: [],
        permissions: [],
      })

      const store = useAuthStore()
      await store.login('user@test.com', 'senha123')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'token-123')
    })

    it('define isAuthenticated como true após login', async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        roles: [],
        permissions: [],
      })

      const store = useAuthStore()
      await store.login('user@test.com', 'senha123')

      expect(store.isAuthenticated).toBe(true)
    })

    it('popula user via getMe após login bem-sucedido', async () => {
      const usuario = {
        id: 'user-1',
        email: 'user@test.com',
        roles: ['admin'],
        permissions: ['invoices:read'],
      }
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue(usuario)

      const store = useAuthStore()
      await store.login('user@test.com', 'senha123')

      expect(authService.getMe).toHaveBeenCalledOnce()
      expect(store.user).toEqual(usuario)
    })

    it('reverte token quando getMe falha após postLogin', async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockRejectedValue(new Error('unauthorized'))

      const store = useAuthStore()
      await expect(store.login('user@test.com', 'senha123')).rejects.toThrow()

      expect(store.isAuthenticated).toBe(false)
      expect(store.accessToken).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
    })

    it('não salva token no localStorage quando postLogin rejeita', async () => {
      vi.mocked(authService.postLogin).mockRejectedValue(new Error('credenciais inválidas'))

      const store = useAuthStore()
      await expect(store.login('user@test.com', 'senha-errada')).rejects.toThrow()

      expect(store.isAuthenticated).toBe(false)
      expect(store.accessToken).toBeNull()
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    // Setup compartilhado: loga o usuário antes de cada teste de logout
    let store: ReturnType<typeof useAuthStore>

    beforeEach(async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        roles: [],
        permissions: [],
      })
      store = useAuthStore()
      await store.login('user@test.com', 'senha123')
    })

    it('remove accessToken do localStorage', () => {
      store.logout()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
    })

    it('reseta user para null após logout', () => {
      store.logout()
      expect(store.user).toBeNull()
    })

    it('define isAuthenticated como false após logout', () => {
      store.logout()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('loadMe', () => {
    it('popula store.user com o retorno de getMe', async () => {
      const usuario = {
        id: 'user-42',
        email: 'carla@test.com',
        roles: ['editor'],
        permissions: ['invoices:write'],
      }
      // Simula token já presente para que loadMe possa ser chamado isoladamente
      localStorageStore['accessToken'] = 'token-existente'
      vi.mocked(authService.getMe).mockResolvedValue(usuario)

      const store = useAuthStore()
      await store.loadMe()

      expect(store.user).toEqual(usuario)
    })
  })

  describe('hidratação via localStorage', () => {
    it('inicializa isAuthenticated como true quando há token salvo no localStorage', () => {
      // Token pré-existente antes da criação do store
      localStorageStore['accessToken'] = 'token-existente'
      vi.stubGlobal('localStorage', localStorageMock)

      // Pinia fresco para não herdar estado de testes anteriores
      setActivePinia(createPinia())
      const store = useAuthStore()

      expect(store.isAuthenticated).toBe(true)
      expect(store.accessToken).toBe('token-existente')
    })
  })
})
