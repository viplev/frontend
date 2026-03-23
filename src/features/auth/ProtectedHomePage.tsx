import { useNavigate } from 'react-router-dom'
import { clearAuthSession, loadAuthSession } from '../../auth/storage'

export function ProtectedHomePage() {
  const navigate = useNavigate()
  const session = loadAuthSession()

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>VIPLEV</h1>
        <p className="auth-text">Authenticated session initialized.</p>
        <p className="auth-session">
          Signed in as <strong>{session?.email ?? 'unknown user'}</strong>
        </p>
        <button type="button" className="auth-button" onClick={handleLogout}>
          Logout
        </button>
      </section>
    </main>
  )
}

