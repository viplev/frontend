import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AuthFailureDetail } from '../../auth/failure'
import {
  getActiveAuthFailureDetail,
  resetAuthFailureState,
  subscribeToAuthFailure,
} from '../../auth/failure'
import { useAuthSession } from '../../auth/AuthSessionContext'
import { loginWithCredentials } from '../../auth/service'

interface LoginLocationState {
  from?: string
}

export function LoginPage() {
  const { setSession } = useAuthSession()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginLocationState | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [authRecoveryMessage, setAuthRecoveryMessage] = useState<string | null>(
    null,
  )
  const feedbackMessage = loginError ?? authRecoveryMessage

  useEffect(() => {
    const pendingFailure = getActiveAuthFailureDetail()
    if (pendingFailure) {
      setAuthRecoveryMessage(pendingFailure.message)
    }

    const unsubscribe = subscribeToAuthFailure((detail: AuthFailureDetail) => {
      setAuthRecoveryMessage(detail.message)
    })

    return unsubscribe
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    setLoginError(null)
    setIsSubmitting(true)

    try {
      const session = await loginWithCredentials({ email, password })
      setSession(session)
      resetAuthFailureState()
      setAuthRecoveryMessage(null)
      setPassword('')

      const from = state?.from
      const redirectTo =
        typeof from === 'string' && from.startsWith('/') && from !== '/login'
          ? from
          : '/'
      navigate(redirectTo, { replace: true })
    } catch (error: unknown) {
      if (error instanceof Error) {
        setLoginError(error.message)
      } else {
        setLoginError('Sign-in failed.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>VIPLEV Sign in</h1>
        <p className="auth-text">
          Sign in with your email and password to access protected features.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {feedbackMessage ? (
            <p
              className={`auth-notice${loginError ? ' auth-notice-error' : ''}`}
              role={loginError ? 'alert' : 'status'}
            >
              {feedbackMessage}
            </p>
          ) : null}

          <label className="auth-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="auth-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label className="auth-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="auth-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}

