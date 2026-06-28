import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

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

export default http
