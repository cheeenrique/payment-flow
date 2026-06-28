import http, { unwrap } from '@/services/http'

// Resposta do endpoint de login
export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

// Perfil do usuário autenticado
export interface User {
  id: string
  email: string
  roles: string[]
  permissions: string[]
}

/**
 * Autentica o usuário com email e senha — POST /auth/login
 */
export async function postLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await http.post<{ data: LoginResponse; meta: unknown }>('/auth/login', {
    email,
    password,
  })
  return unwrap(res)
}

/**
 * Retorna o perfil do usuário autenticado — GET /auth/me
 */
export async function getMe(): Promise<User> {
  const res = await http.get<{ data: User; meta: unknown }>('/auth/me')
  return unwrap(res)
}
