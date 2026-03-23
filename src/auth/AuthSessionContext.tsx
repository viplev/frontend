import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { loadAuthSession, saveAuthSession } from './storage'
import { isTokenExpired } from './jwt'
import { performLogoutTeardown, subscribeToLogoutResets } from './logout'
import type { AuthSession } from './types'

interface AuthSessionContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  setSession: (session: AuthSession) => void
  logout: () => void
}

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(
  undefined,
)

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() =>
    loadAuthSession(),
  )

  const setSession = useCallback((nextSession: AuthSession) => {
    saveAuthSession(nextSession)
    setSessionState(nextSession)
  }, [])

  const logout = useCallback(() => {
    performLogoutTeardown()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToLogoutResets(() => {
      setSessionState(null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (session && isTokenExpired(session.token)) {
      performLogoutTeardown()
    }
  }, [session])

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      setSession,
      logout,
    }),
    [logout, session, setSession],
  )

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthSession() {
  const context = useContext(AuthSessionContext)
  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider')
  }

  return context
}

