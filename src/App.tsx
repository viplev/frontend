import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from './auth/AuthGuard'
import { PublicOnlyGuard } from './auth/PublicOnlyGuard'
import { LoginPage } from './features/auth/LoginPage'
import { AppShell } from './features/shell/AppShell'
import { ShellPlaceholderPage } from './features/shell/ShellPlaceholderPage'
import { ProtectedHomePage } from './features/auth/ProtectedHomePage'
import { EnvironmentsPage } from './features/environments/EnvironmentsPage'
import { CreateEnvironmentPage } from './features/environments/CreateEnvironmentPage'
import { EnvironmentDetailsPage } from './features/environments/EnvironmentDetailsPage'
import { BenchmarkFormPage } from './features/benchmarks/BenchmarkFormPage'
import { BenchmarkRunMonitorPage } from './features/benchmarks/BenchmarkRunMonitorPage'
import { BenchmarkRunResultsPage } from './features/benchmarks/BenchmarkRunResultsPage'
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
          <Route path="/environments" element={<EnvironmentsPage />} />
          <Route path="/environments/new" element={<CreateEnvironmentPage />} />
          <Route
            path="/environments/:environmentId"
            element={<EnvironmentDetailsPage />}
          />
          <Route
            path="/environments/:environmentId/benchmarks/new"
            element={<BenchmarkFormPage />}
          />
          <Route
            path="/environments/:environmentId/benchmarks/:benchmarkId/edit"
            element={<BenchmarkFormPage />}
          />
          <Route
            path="/environments/:environmentId/benchmarks/:benchmarkId/runs/:runId"
            element={<BenchmarkRunMonitorPage />}
          />
          <Route
            path="/environments/:environmentId/benchmarks/:benchmarkId/runs/:runId/results"
            element={<BenchmarkRunResultsPage />}
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
