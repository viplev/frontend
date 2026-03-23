import { useAuthSession } from '../../auth/AuthSessionContext'

export function ProtectedHomePage() {
  const { session } = useAuthSession()

  return (
    <article className="shell-page">
      <h1>Dashboard</h1>
      <p className="auth-text">
        Authenticated session initialized for{' '}
        <strong>{session?.email ?? 'unknown user'}</strong>.
      </p>
      <p>
        Use the persistent navigation to move between upcoming environments and
        benchmark views.
      </p>
    </article>
  )
}

