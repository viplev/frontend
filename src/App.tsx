import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/shell/AppShell';

import { LoginPage } from './pages/LoginPage';
import { EnvironmentsPage } from './pages/environments/EnvironmentsPage';
import { CreateEnvironmentPage } from './pages/environments/CreateEnvironmentPage';
import { EnvironmentDetailPage } from './pages/environments/EnvironmentDetailPage';
import { ServicesPage } from './pages/environments/ServicesPage';
import { EnvironmentMessagesPage } from './pages/environments/EnvironmentMessagesPage';
import { BenchmarksPage } from './pages/benchmarks/BenchmarksPage';
import { BenchmarkFormPage } from './pages/benchmarks/BenchmarkFormPage';
import { RunHistoryPage } from './pages/runs/RunHistoryPage';
import { RunMonitorPage } from './pages/runs/RunMonitorPage';
import { RunResultsPage } from './pages/runs/RunResultsPage';
import { AllActiveRunsPage } from './pages/runs/AllActiveRunsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Environments */}
              <Route index element={<Navigate to="/environments" replace />} />
              <Route path="environments" element={<EnvironmentsPage />} />
              <Route path="environments/new" element={<CreateEnvironmentPage />} />

              {/* Environment detail with nested tabs */}
              <Route path="environments/:environmentId" element={<EnvironmentDetailPage />}>
                <Route index element={<Navigate to="benchmarks" replace />} />
                <Route path="benchmarks" element={<BenchmarksPage />} />
                <Route path="runs" element={<RunHistoryPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="messages" element={<EnvironmentMessagesPage />} />
              </Route>

              {/* Benchmark form (outside environment tabs layout) */}
              <Route
                path="environments/:environmentId/benchmarks/new"
                element={<BenchmarkFormPage />}
              />
              <Route
                path="environments/:environmentId/benchmarks/:benchmarkId/edit"
                element={<BenchmarkFormPage />}
              />

              {/* Run pages */}
              <Route
                path="environments/:environmentId/benchmarks/:benchmarkId/runs/:runId"
                element={<RunMonitorPage />}
              />
              <Route
                path="environments/:environmentId/benchmarks/:benchmarkId/runs/:runId/results"
                element={<RunResultsPage />}
              />

              {/* Global active runs */}
              <Route path="runs/active" element={<AllActiveRunsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/environments" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

