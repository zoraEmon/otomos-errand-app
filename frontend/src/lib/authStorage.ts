const AUTH_TOKEN_KEY = 'otomos.auth.token'

export function getAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function saveAuthToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token.replace(/^Bearer\s+/i, ''))
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
}
