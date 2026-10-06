import type { AuthResponseData, LoginInput, SignupInput } from '../../../shared/contracts/auth.contract'
import { getAuthToken, saveAuthToken } from './authStorage'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

type ApiErrorBody = {
  error?: string
  details?: Record<string, string[]>
}

export class ApiError extends Error {
  status: number
  details?: Record<string, string[]>

  constructor(status: number, body: ApiErrorBody) {
    super(body.error ?? 'Something went wrong.')
    this.name = 'ApiError'
    this.status = status
    this.details = body.details
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
  const body = await response.json().catch(() => ({})) as ApiErrorBody & T

  if (!response.ok) {
    throw new ApiError(response.status, body)
  }

  return body
}

export async function signup(input: SignupInput): Promise<AuthResponseData> {
  const response = await request<AuthResponseData>('/auth/signup', {
    body: JSON.stringify(input),
    method: 'POST',
  })
  saveAuthToken(response.token)
  return response
}

export async function login(input: LoginInput): Promise<AuthResponseData> {
  const response = await request<AuthResponseData>('/auth/login', {
    body: JSON.stringify(input),
    method: 'POST',
  })
  saveAuthToken(response.token)
  return response
}

export { request as apiRequest }
