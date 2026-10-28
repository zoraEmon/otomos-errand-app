import type { AuthResponseData, LoginInput, SignupInput } from '../../../shared/contracts/auth.contract'
import type { CreateErrandInput } from '../../../shared/contracts/errand.contract'
import type { ErrandDTO } from '../../../shared/contracts/errand.contract'
import { getAuthToken, saveAuthToken, saveAuthUser } from './authStorage'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

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
  saveAuthUser(response.user)
  return response
}

export async function login(input: LoginInput): Promise<AuthResponseData> {
  const response = await request<AuthResponseData>('/auth/login', {
    body: JSON.stringify(input),
    method: 'POST',
  })
  saveAuthToken(response.token)
  saveAuthUser(response.user)
  return response
}

export type ConnectedRunner = {
  id: string
  username: string
  code7: string
}

export type PendingConnectionRequest = {
  id: string
  sender: {
    id: string
    username: string
    code7: string
  }
  createdAt: string
}

export async function getPendingConnections(): Promise<PendingConnectionRequest[]> {
  return request<PendingConnectionRequest[]>('/connections/pending')
}

export async function acceptConnectionRequest(id: string): Promise<void> {
  await request(`/connections/${id}/accept`, { method: 'POST' })
}

export async function rejectConnectionRequest(id: string): Promise<void> {
  await request(`/connections/${id}/reject`, { method: 'POST' })
}

export type CreateErrandResponse = {
  errand: {
    id: string
    status: string
  }
}

export type ErrandSummary = {
  id: string
  role: 'commander' | 'runner'
  status: string
  itemCount: number
  otherUser: { id: string; username: string; code7: string }
}

export async function getErrands(): Promise<ErrandSummary[]> {
  return request<ErrandSummary[]>('/errands')
}

export async function acceptErrandRequest(id: string): Promise<void> {
  await request(`/errands/${id}/accept`, { method: 'POST' })
}

export async function rejectErrandRequest(id: string): Promise<void> {
  await request(`/errands/${id}/reject`, { method: 'POST' })
}

export async function getConnectedRunners(): Promise<ConnectedRunner[]> {
  return request<ConnectedRunner[]>('/connections')
}

export async function connectWithFriend(targetCode7: string): Promise<void> {
  await request('/connections', {
    body: JSON.stringify({ targetCode7 }),
    method: 'POST',
  })
}

export async function createErrand(input: CreateErrandInput): Promise<CreateErrandResponse> {
  return request<CreateErrandResponse>('/errands', {
    body: JSON.stringify(input),
    method: 'POST',
  })
}

export async function getErrand(id: string): Promise<{ errand: ErrandDTO }> {
  return request<{ errand: ErrandDTO }>(`/errands/${id}`)
}

export async function updateErrandItem(errandId: string, itemId: string, isBought: boolean): Promise<void> {
  await request(`/errands/${errandId}/items/${itemId}`, {
    body: JSON.stringify({ isBought }),
    method: 'PATCH',
  })
}

export async function updateErrandStatus(errandId: string, status: ErrandDTO['status']): Promise<{ errand: ErrandDTO }> {
  return request<{ errand: ErrandDTO }>(`/errands/${errandId}/status`, {
    body: JSON.stringify({ status }),
    method: 'PATCH',
  })
}

export { request as apiRequest }
