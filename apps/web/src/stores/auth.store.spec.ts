import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import * as authService from '@/services/auth.service'

vi.mock('@/services/auth.service')

describe('auth.store', () => {
  let localStorageStore: Record<string, string> = {}

  const localStorageMock = {
    getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value }),
    removeItem: vi.fn((key: string) => { delete localStorageStore[key] }),
    clear: vi.fn(() => { localStorageStore = {} }),
  }

  beforeEach(() => {
    localStorageStore = {}
    vi.stubGlobal('localStorage', localStorageMock)
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
        id: 'user-1', email: 'user@test.com', roles: [], permissions: [],
      })

      const store = useAuthStore()
      await store.login('user@test.com', 'senha123')

      expect(authService.postLogin).toHaveBeenCalledWith('user@test.com', 'senha123')
    })

    it('salva accessToken e refreshToken no localStorage após login bem-sucedido', async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 'user-1', email: 'user@test.com', roles: [], permissions: [],
      })

      const store = useAuthStore()
      await store.login('user@test.com', 'senha123')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'token-123')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-abc')
    })

    it('define isAuthenticated como true após login', async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 'user-1', email: 'user@test.com', roles: [], permissions: [],
      })

      const store = useAuthStore()
      await store.login('user@test.com', 'senha123')

      expect(store.isAuthenticated).toBe(true)
    })

    it('popula user via getMe após login bem-sucedido', async () => {
      const user = { id: 'user-1', email: 'user@test.com', roles: ['admin'], permissions: ['invoices:read'] }
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue(user)

      const store = useAuthStore()
      await store.login('user@test.com', 'senha123')

      expect(authService.getMe).toHaveBeenCalledOnce()
      expect(store.user).toEqual(user)
    })

    it('reverte tokens quando getMe falha após postLogin', async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockRejectedValue(new Error('unauthorized'))

      const store = useAuthStore()
      await expect(store.login('user@test.com', 'senha123')).rejects.toThrow()

      expect(store.isAuthenticated).toBe(false)
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken')
    })

    it('não salva tokens no localStorage quando postLogin rejeita', async () => {
      vi.mocked(authService.postLogin).mockRejectedValue(new Error('credenciais inválidas'))

      const store = useAuthStore()
      await expect(store.login('user@test.com', 'senha-errada')).rejects.toThrow()

      expect(store.isAuthenticated).toBe(false)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('accessToken é readonly — atribuição direta não altera o valor', async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 'user-1', email: 'user@test.com', roles: [], permissions: [],
      })

      const store = useAuthStore()
      await store.login('user@test.com', 'senha123')

      // Tentativa de mutação direta em computed readonly deve ser ignorada (ou lançar em dev)
      // A intenção do teste é verificar que o valor não muda sem chamar setAccessToken
      const before = store.accessToken
      try { (store as unknown as { accessToken: string }).accessToken = 'hacked' } catch { /* expected */ }
      expect(store.accessToken).toBe(before)
    })
  })

  describe('logout', () => {
    let store: ReturnType<typeof useAuthStore>

    beforeEach(async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 'user-1', email: 'user@test.com', roles: [], permissions: [],
      })
      store = useAuthStore()
      await store.login('user@test.com', 'senha123')
    })

    it('remove accessToken e refreshToken do localStorage', () => {
      store.logout()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken')
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
      const user = { id: 'user-42', email: 'carla@test.com', roles: ['editor'], permissions: ['invoices:write'] }
      localStorageStore['accessToken'] = 'token-existente'
      vi.mocked(authService.getMe).mockResolvedValue(user)

      const store = useAuthStore()
      await store.loadMe()

      expect(store.user).toEqual(user)
    })
  })

  describe('hidratação via localStorage', () => {
    it('inicializa isAuthenticated como true quando há token salvo no localStorage', () => {
      localStorageStore['accessToken'] = 'token-existente'
      localStorageStore['refreshToken'] = 'refresh-existente'
      vi.stubGlobal('localStorage', localStorageMock)

      setActivePinia(createPinia())
      const store = useAuthStore()

      expect(store.isAuthenticated).toBe(true)
      expect(store.accessToken).toBe('token-existente')
      expect(store.refreshToken).toBe('refresh-existente')
    })
  })

  describe('setAccessToken', () => {
    it('atualiza accessToken e persiste no localStorage', async () => {
      vi.mocked(authService.postLogin).mockResolvedValue({
        accessToken: 'token-123',
        refreshToken: 'refresh-abc',
      })
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 'user-1', email: 'user@test.com', roles: [], permissions: [],
      })

      const store = useAuthStore()
      await store.login('user@test.com', 'senha123')
      store.setAccessToken('new-token-456')

      expect(store.accessToken).toBe('new-token-456')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-token-456')
    })
  })
})
