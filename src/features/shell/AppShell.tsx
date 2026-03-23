import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuthSession } from '../../auth/AuthSessionContext'
import {
  getActiveAuthFailureDetail,
  resetAuthFailureState,
} from '../../auth/failure'

function ShellGlobalAlert() {
  const detail = getActiveAuthFailureDetail()
  if (!detail) {
    return null
  }

  return (
    <section className="shell-alert" role="alert">
      <span>{detail.message}</span>
      <button
        type="button"
        className="shell-alert-dismiss"
        onClick={() => resetAuthFailureState()}
      >
        Dismiss
      </button>
    </section>
  )
}

export function AppShell() {
  const { session, logout } = useAuthSession()

  return (
    <div className="app-shell">
      <aside className="shell-sidebar">
        <Link to="/" className="shell-brand">
          VIPLEV
        </Link>
        <nav className="shell-nav">
          <NavLink to="/" end className="shell-nav-link">
            Dashboard
          </NavLink>
          <NavLink to="/environments" className="shell-nav-link">
            Environments
          </NavLink>
          <NavLink to="/benchmarks" className="shell-nav-link">
            Benchmarks
          </NavLink>
        </nav>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <div>
            <p className="shell-context-label">Current context</p>
            <p className="shell-context-value">
              Authenticated as {session?.email ?? 'unknown user'}
            </p>
          </div>
          <button type="button" className="auth-button shell-logout" onClick={logout}>
            Logout
          </button>
        </header>

        <ShellGlobalAlert />

        <section className="shell-content">
          <Outlet />
        </section>
      </div>
    </div>
  )
}

