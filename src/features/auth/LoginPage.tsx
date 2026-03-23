import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginWithCredentials } from '../../auth/service'
import { saveAuthSession } from '../../auth/storage'

interface LoginLocationState {
  from?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginLocationState | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    setLoginError(null)
    setIsSubmitting(true)

    try {
      const session = await loginWithCredentials({ email, password })
      saveAuthSession(session)
      setPassword('')

      const redirectTo = state?.from && state.from !== '/login' ? state.from : '/'
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

          {loginError ? <p className="auth-error">{loginError}</p> : null}

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}

