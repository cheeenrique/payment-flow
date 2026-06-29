import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// Formato padrão de todas as respostas da API REST
export interface ApiEnvelope<T> {
  data: T
  meta: unknown
}

/**
 * Injeta o header Authorization quando há token no localStorage.
 * Exportada separadamente para facilitar testes unitários sem mockar axios.
 */
export function applyJwtHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = localStorage.getItem('accessToken')

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  return config
}

/**
 * Extrai `res.data.data` do envelope `{ data, meta }` retornado pela API.
 */
export function unwrap<T>(res: AxiosResponse<ApiEnvelope<T>>): T {
  return res.data.data
}

// Instância compartilhada — baseURL vem da variável de ambiente VITE_API_URL
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Interceptor de request: adiciona JWT em todas as requisições autenticadas
http.interceptors.request.use(applyJwtHeader)

// Controla se já há um refresh em andamento (evita chamadas paralelas duplicadas)
let isRefreshing = false
let pendingRetry: Array<(token: string) => void> = []

function drainPending(token: string): void {
  pendingRetry.forEach((cb) => cb(token))
  pendingRetry = []
}

const AUTH_SKIP_URLS = ['/auth/login', '/auth/refresh']

/**
 * Interceptor de response:
 * - Em 401 em rotas autenticadas: tenta refresh do token uma vez.
 * - Se refresh bem-sucedido: atualiza token e retenta request original.
 * - Se refresh falhar: faz logout e redireciona para /login.
 * - Chamadas para /auth/login e /auth/refresh são ignoradas (evita loop).
 */
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    const url = originalConfig?.url ?? ''
    const isSkipped = AUTH_SKIP_URLS.some((skip) => url.includes(skip))

    if (isSkipped || originalConfig._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRetry.push((token) => {
          originalConfig._retry = true
          originalConfig.headers['Authorization'] = `Bearer ${token}`
          http.request(originalConfig).then(resolve).catch(reject)
        })
      })
    }

    originalConfig._retry = true
    isRefreshing = true

    try {
      const { useAuthStore } = await import('@/stores/auth.store')
      const store = useAuthStore()
      const refreshToken = store.refreshToken

      if (!refreshToken) {
        throw new Error('no refresh token')
      }

      const { postRefresh } = await import('@/services/auth.service')
      const { accessToken } = await postRefresh(refreshToken)

      store.setAccessToken(accessToken)
      drainPending(accessToken)

      originalConfig.headers['Authorization'] = `Bearer ${accessToken}`
      return http.request(originalConfig)
    } catch {
      const { useAuthStore } = await import('@/stores/auth.store')
      useAuthStore().logout()
      const { default: router } = await import('@/router')
      void router.push('/login')
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default http
