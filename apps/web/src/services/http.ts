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

/**
 * Interceptor de response: em 401, faz logout e redireciona para /login.
 * Usa importação dinâmica para evitar dependência circular (http → auth.store → auth.service → http).
 * Chamadas de login são ignoradas para evitar loop de redirecionamento.
 */
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? ''
      const isLoginRequest = url.includes('/auth/login')
      if (!isLoginRequest) {
        void import('@/stores/auth.store').then(({ useAuthStore }) => {
          useAuthStore().logout()
        })
        void import('@/router').then(({ default: router }) => {
          void router.push('/login')
        })
      }
    }
    return Promise.reject(error)
  },
)

export default http
