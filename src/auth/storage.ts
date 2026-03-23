import type { AuthSession } from './types'

const AUTH_SESSION_STORAGE_KEY = 'viplev.auth.session'

export function loadAuthSession(): AuthSession | null {
  const serialized = localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
  if (!serialized) {
    return null
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<AuthSession>
    if (!parsed.token || !parsed.email) {
      return null
    }

    return {
      token: parsed.token,
      email: parsed.email,
      userId: parsed.userId,
    }
  } catch {
    return null
  }
}

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
}

