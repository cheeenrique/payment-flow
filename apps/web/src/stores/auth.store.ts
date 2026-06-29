import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as authService from '@/services/auth.service'
import type { User } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  // Tokens internos — mutados somente por login/logout/setAccessToken
  const _accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const _refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))

  // Readonly: código externo lê mas não grava diretamente
  const accessToken = computed(() => _accessToken.value)
  const refreshToken = computed(() => _refreshToken.value)

  const isAuthenticated = computed(() => _accessToken.value !== null)

  /** Persiste novos tokens na memória e no localStorage */
  function setTokens(access: string, refresh: string): void {
    _accessToken.value = access
    _refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  /**
   * Atualiza apenas o accessToken (chamado pelo interceptor de refresh).
   */
  function setAccessToken(token: string): void {
    _accessToken.value = token
    localStorage.setItem('accessToken', token)
  }

  /**
   * Realiza login: obtém tokens, persiste e carrega perfil do usuário.
   */
  async function login(email: string, password: string): Promise<void> {
    const response = await authService.postLogin(email, password)
    setTokens(response.accessToken, response.refreshToken)
    try {
      await loadMe()
    } catch (err) {
      logout()
      throw err
    }
  }

  /**
   * Encerra a sessão: remove tokens e limpa o estado local
   */
  function logout(): void {
    _accessToken.value = null
    _refreshToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  /**
   * Carrega o perfil do usuário autenticado via API
   */
  async function loadMe(): Promise<void> {
    user.value = await authService.getMe()
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    login,
    logout,
    loadMe,
    setAccessToken,
  }
})
