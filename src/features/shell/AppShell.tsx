import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuthSession } from '../../auth/AuthSessionContext'
import type { AuthFailureDetail } from '../../auth/failure'
import {
  getActiveAuthFailureDetail,
  resetAuthFailureState,
  subscribeToAuthFailure,
} from '../../auth/failure'
import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'
import { listActiveEnvironmentRuns } from '../benchmarks/service'
import { EnvironmentsLoadError, listEnvironments } from '../environments/service'

function getTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isEnvironmentLike(value: unknown): value is EnvironmentDTO {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as { name?: unknown; type?: unknown }
  return typeof candidate.name === 'string' && typeof candidate.type === 'string'
}

type SidebarEnvironmentItem = {
  id: string
  label: string
  indicator: 'inactive' | 'active-idle' | 'active-running'
}

const AGENT_ACTIVE_THRESHOLD_MS = 2 * 60 * 1000

function isAgentCurrentlyActive(lastSeenAt?: Date | string): boolean {
  if (!lastSeenAt) {
    return false
  }

  const parsed = new Date(lastSeenAt)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return Date.now() - parsed.getTime() <= AGENT_ACTIVE_THRESHOLD_MS
}

function ShellGlobalAlert() {
  const [detail, setDetail] = useState<AuthFailureDetail | null>(() =>
    getActiveAuthFailureDetail(),
  )

  useEffect(() => {
    const unsubscribe = subscribeToAuthFailure((nextDetail: AuthFailureDetail) => {
      setDetail(nextDetail)
    })

    return unsubscribe
  }, [])

  if (!detail) {
    return null
  }

  return (
    <section className="shell-alert" role="alert">
      <span>{detail.message}</span>
      <button
        type="button"
        className="shell-alert-dismiss"
        onClick={() => {
          resetAuthFailureState()
          setDetail(null)
        }}
      >
        Dismiss
      </button>
    </section>
  )
}

export function AppShell() {
  const { session, logout } = useAuthSession()
  const [isEnvMenuOpen, setIsEnvMenuOpen] = useState(false)
  const [isEnvMenuLoading, setIsEnvMenuLoading] = useState(false)
  const [envMenuError, setEnvMenuError] = useState<string | null>(null)
  const [envMenuItems, setEnvMenuItems] = useState<Array<SidebarEnvironmentItem>>([])

  useEffect(() => {
    const controller = new AbortController()
    setIsEnvMenuLoading(true)
    setEnvMenuError(null)
    setEnvMenuItems([])

    const loadSidebarEnvironments = async () => {
      try {
        const environments = await listEnvironments(controller.signal)
        if (controller.signal.aborted) {
          return
        }

        const validEnvironments = environments
          .filter(isEnvironmentLike)
          .map((environment) => {
            const id = getTrimmedString(environment.id)
            return {
              id,
              label: getTrimmedString(environment.name) || id || 'Unnamed environment',
              agentLastSeenAt: environment.agentLastSeenAt,
            }
          })
          .filter((environment) => environment.id)
          .sort((a, b) => a.label.localeCompare(b.label))

        if (validEnvironments.length === 0) {
          setEnvMenuItems([])
          setIsEnvMenuLoading(false)
          return
        }

        const runStatusEntries = await Promise.all(
          validEnvironments.map(async (environment) => {
            try {
              const runs = await listActiveEnvironmentRuns(environment.id, controller.signal)
              if (controller.signal.aborted) {
                return [environment.id, false] as const
              }
              return [environment.id, runs.length > 0] as const
            } catch {
              return [environment.id, false] as const
            }
          }),
        )

        if (controller.signal.aborted) {
          return
        }

        const statusById = Object.fromEntries(runStatusEntries)
        setEnvMenuItems(
          validEnvironments.map((environment) => ({
            id: environment.id,
            label: environment.label,
            indicator: !isAgentCurrentlyActive(environment.agentLastSeenAt)
              ? 'inactive'
              : statusById[environment.id]
                ? 'active-running'
                : 'active-idle',
          })),
        )
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return
        }

        if (error instanceof EnvironmentsLoadError) {
          setEnvMenuError(error.message)
        } else {
          setEnvMenuError('Unable to load environments in sidebar right now.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsEnvMenuLoading(false)
        }
      }
    }

    void loadSidebarEnvironments()

    return () => controller.abort()
  }, [])

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
          <div
            className="shell-nav-group"
            onMouseEnter={() => setIsEnvMenuOpen(true)}
            onMouseLeave={() => setIsEnvMenuOpen(false)}
            onFocusCapture={() => setIsEnvMenuOpen(true)}
            onBlurCapture={(event) => {
              const nextFocused = event.relatedTarget
              if (!(nextFocused instanceof Node) || !event.currentTarget.contains(nextFocused)) {
                setIsEnvMenuOpen(false)
              }
            }}
          >
            <NavLink
              to="/environments"
              className={({ isActive }) =>
                `shell-nav-link shell-nav-link-expandable${isActive || isEnvMenuOpen ? ' active' : ''}`
              }
              aria-expanded={isEnvMenuOpen}
            >
              <span>Environments</span>
              <span className="shell-nav-caret" aria-hidden="true">
                {isEnvMenuOpen ? '▾' : '▸'}
              </span>
            </NavLink>
            {isEnvMenuOpen ? (
              <div className="shell-submenu" role="group" aria-label="Environment quick navigation">
                {isEnvMenuLoading ? (
                  <p className="shell-submenu-state">Loading environments...</p>
                ) : envMenuError ? (
                  <p className="shell-submenu-state shell-submenu-state-error">{envMenuError}</p>
                ) : envMenuItems.length === 0 ? (
                  <p className="shell-submenu-state">No environments yet.</p>
                ) : (
                  envMenuItems.map((environment) => (
                    <NavLink
                      key={environment.id}
                      to={`/environments/${environment.id}`}
                      className="shell-submenu-link"
                    >
                      <span className="shell-submenu-link-label">{environment.label}</span>
                      <span
                        className={`shell-submenu-indicator shell-submenu-indicator-${environment.indicator}`}
                        title={
                          environment.indicator === 'active-running'
                            ? 'Agent active, benchmark running'
                            : environment.indicator === 'active-idle'
                              ? 'Agent active, no benchmark running'
                              : 'Agent inactive or never seen'
                        }
                      />
                    </NavLink>
                  ))
                )}
              </div>
            ) : null}
          </div>
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

