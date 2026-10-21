import { request } from '../../../shared/api'

interface LoginResponse {
  token: string
}

export const login = (password: string) =>
  request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { password },
  })
