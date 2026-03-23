import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from './auth/AuthGuard'
import { PublicOnlyGuard } from './auth/PublicOnlyGuard'
import { LoginPage } from './features/auth/LoginPage'
import { AppShell } from './features/shell/AppShell'
import { ShellPlaceholderPage } from './features/shell/ShellPlaceholderPage'
import { ProtectedHomePage } from './features/auth/ProtectedHomePage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyGuard />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<AuthGuard />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<ProtectedHomePage />} />
          <Route
            path="/environments"
            element={
              <ShellPlaceholderPage
                title="Environments"
                description="Environment overview and management will live here."
              />
            }
          />
          <Route
            path="/benchmarks"
            element={
              <ShellPlaceholderPage
                title="Benchmarks"
                description="Benchmark catalog and run orchestration views will live here."
              />
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
