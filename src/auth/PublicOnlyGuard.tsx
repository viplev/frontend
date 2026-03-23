import { Navigate, Outlet } from 'react-router-dom'
import { useAuthSession } from './AuthSessionContext'

export function PublicOnlyGuard() {
  const { isAuthenticated } = useAuthSession()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

