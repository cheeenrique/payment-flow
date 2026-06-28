import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as authService from '@/services/auth.service'
import type { User } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  // Perfil do usuário autenticado — null quando não há sessão ativa
  const user = ref<User | null>(null)

  // Token de acesso — inicializado a partir do localStorage para persistir sessão
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))

  // Autenticado enquanto houver token válido
  const isAuthenticated = computed(() => accessToken.value !== null)

  /**
   * Realiza login: obtém token, persiste e carrega perfil do usuário
   */
  async function login(email: string, password: string): Promise<void> {
    const response = await authService.postLogin(email, password)
    accessToken.value = response.accessToken
    localStorage.setItem('accessToken', response.accessToken)
    await loadMe()
  }

  /**
   * Encerra a sessão: remove token e limpa o estado local
   */
  function logout(): void {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
  }

  /**
   * Carrega o perfil do usuário autenticado via API
   */
  async function loadMe(): Promise<void> {
    user.value = await authService.getMe()
  }

  return { user, accessToken, isAuthenticated, login, logout, loadMe }
})
