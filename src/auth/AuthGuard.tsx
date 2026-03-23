import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthSession } from './AuthSessionContext'

export function AuthGuard() {
  const location = useLocation()
  const { isAuthenticated } = useAuthSession()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    )
  }

  return <Outlet />
}

