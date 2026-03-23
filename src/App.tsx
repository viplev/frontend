import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from './auth/AuthGuard'
import { PublicOnlyGuard } from './auth/PublicOnlyGuard'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedHomePage } from './features/auth/ProtectedHomePage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyGuard />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<AuthGuard />}>
        <Route path="/" element={<ProtectedHomePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
