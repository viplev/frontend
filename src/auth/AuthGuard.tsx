import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { loadAuthSession } from './storage'

export function AuthGuard() {
  const location = useLocation()
  const session = loadAuthSession()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

