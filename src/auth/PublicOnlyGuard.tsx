import { Navigate, Outlet } from 'react-router-dom'
import { loadAuthSession } from './storage'

export function PublicOnlyGuard() {
  const session = loadAuthSession()

  if (session) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

