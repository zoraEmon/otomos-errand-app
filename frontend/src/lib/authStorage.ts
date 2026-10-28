const AUTH_TOKEN_KEY = 'otomos.auth.token'
const AUTH_USER_KEY = 'otomos.auth.user'

export type AuthUser = {
  id: string
  username: string
  code7: string
  createdAt: string
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function saveAuthToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token.replace(/^Bearer\s+/i, ''))
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(AUTH_USER_KEY)
}

export function saveAuthUser(user: AuthUser): void {
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function getAuthUser(): AuthUser | null {
  const storedUser = window.localStorage.getItem(AUTH_USER_KEY)
  if (!storedUser) return null

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    return null
  }
}
