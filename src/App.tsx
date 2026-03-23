import { useState } from 'react'
import type { FormEvent } from 'react'
import { loginWithCredentials } from './auth/service'
import { loadAuthSession, saveAuthSession } from './auth/storage'
import type { AuthSession } from './auth/types'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadAuthSession(),
  )
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
      const authenticatedSession = await loginWithCredentials({
        email,
        password,
      })
      saveAuthSession(authenticatedSession)
      setSession(authenticatedSession)
      setPassword('')
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

  if (session) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>VIPLEV</h1>
          <p className="auth-text">Authenticated session initialized.</p>
          <p className="auth-session">
            Signed in as <strong>{session.email}</strong>
          </p>
        </section>
      </main>
    )
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

export default App
