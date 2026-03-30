import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthSession } from '../../auth/AuthSessionContext'
import type { AuthFailureDetail } from '../../auth/failure'
import {
  getActiveAuthFailureDetail,
  resetAuthFailureState,
  subscribeToAuthFailure,
} from '../../auth/failure'
import { listActiveEnvironmentRuns } from '../benchmarks/service'
import { EnvironmentsLoadError, listEnvironments } from '../environments/service'
import {
  getTrimmedString,
  isEnvironmentLike,
  resolveAgentStatus,
} from '../environments/utils'

type SidebarEnvironmentItem = {
  id: string
  label: string
  indicator: 'inactive' | 'active-idle' | 'active-running' | 'unknown'
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
  const navigate = useNavigate()
  const location = useLocation()
  const { session, logout } = useAuthSession()
  const [isEnvMenuOpen, setIsEnvMenuOpen] = useState(false)
  const [isEnvMenuPinnedOpen, setIsEnvMenuPinnedOpen] = useState(false)
  const [isEnvMenuLoading, setIsEnvMenuLoading] = useState(false)
  const [hasLoadedEnvMenu, setHasLoadedEnvMenu] = useState(false)
  const [envMenuError, setEnvMenuError] = useState<string | null>(null)
  const [envMenuItems, setEnvMenuItems] = useState<Array<SidebarEnvironmentItem>>([])
  const [createEnvironmentError, setCreateEnvironmentError] = useState<string | null>(null)

  useEffect(() => {
    if (location.pathname === '/environments/new') {
      setCreateEnvironmentError(null)
    }
  }, [location.pathname])

  useEffect(() => {
    if (!isEnvMenuOpen || hasLoadedEnvMenu) {
      return
    }

    const controller = new AbortController()
    setHasLoadedEnvMenu(true)
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
                return [environment.id, false, false] as const
              }
              return [environment.id, runs.length > 0, true] as const
            } catch {
              return [environment.id, false, false] as const
            }
          }),
        )

        if (controller.signal.aborted) {
          return
        }

        const statusById = Object.fromEntries(
          runStatusEntries.map(([environmentId, hasRunning]) => [environmentId, hasRunning]),
        )
        const statusKnownById = Object.fromEntries(
          runStatusEntries.map(([environmentId, , isKnown]) => [environmentId, isKnown]),
        )
        setEnvMenuItems(
          validEnvironments.map((environment) => ({
            id: environment.id,
            label: environment.label,
            indicator: !statusKnownById[environment.id]
              ? 'unknown'
              : statusById[environment.id]
                ? 'active-running'
                : resolveAgentStatus(environment.agentLastSeenAt).variant === 'active'
                  ? 'active-idle'
                  : 'inactive',
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
  }, [hasLoadedEnvMenu, isEnvMenuOpen])

  const handleCreateEnvironmentClick = () => {
    setCreateEnvironmentError(null)

    if (!session) {
      setCreateEnvironmentError('Create environment is unavailable right now. Please sign in again.')
      return
    }

    try {
      navigate('/environments/new')
    } catch {
      setCreateEnvironmentError(
        'Create environment is unavailable right now. Please open Environments and try again.',
      )
    }
  }

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
            onMouseLeave={() => {
              if (!isEnvMenuPinnedOpen) {
                setIsEnvMenuOpen(false)
              }
            }}
            onFocusCapture={() => setIsEnvMenuOpen(true)}
            onBlurCapture={(event) => {
              const nextFocused = event.relatedTarget
              if (
                (!nextFocused ||
                  !(nextFocused instanceof Node) ||
                  !event.currentTarget.contains(nextFocused)) &&
                !isEnvMenuPinnedOpen
              ) {
                setIsEnvMenuOpen(false)
              }
            }}
          >
            <div className="shell-nav-link-row">
              <NavLink
                to="/environments"
                className={({ isActive }) =>
                  `shell-nav-link shell-nav-link-expandable${isActive || isEnvMenuOpen ? ' active' : ''}`
                }
                aria-expanded={isEnvMenuOpen}
              >
                <span>Environments</span>
              </NavLink>
              <button
                type="button"
                className={`shell-nav-pin-toggle${isEnvMenuPinnedOpen ? ' active' : ''}`}
                aria-label={
                  isEnvMenuPinnedOpen
                    ? 'Unpin environments menu'
                    : 'Pin environments menu open'
                }
                aria-pressed={isEnvMenuPinnedOpen}
                onClick={() => {
                  setIsEnvMenuOpen(true)
                  setIsEnvMenuPinnedOpen((current) => !current)
                }}
              >
                <span className="shell-nav-caret" aria-hidden="true">
                  {isEnvMenuOpen ? '▾' : '▸'}
                </span>
              </button>
            </div>
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
                              : environment.indicator === 'inactive'
                                ? 'Agent inactive or never seen'
                                : 'Benchmark status unknown'
                        }
                        aria-label={
                          environment.indicator === 'active-running'
                            ? 'Agent active, benchmark running'
                            : environment.indicator === 'active-idle'
                              ? 'Agent active, no benchmark running'
                              : environment.indicator === 'inactive'
                                ? 'Agent inactive or never seen'
                                : 'Benchmark status unknown'
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
          <div className="shell-topbar-actions">
            <button
              type="button"
              className="auth-button shell-create-environment-cta"
              onClick={handleCreateEnvironmentClick}
            >
              Create environment
            </button>
            <button type="button" className="auth-button shell-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {createEnvironmentError ? (
          <p className="auth-notice auth-notice-error shell-topbar-notice" role="alert">
            {createEnvironmentError}
          </p>
        ) : null}

        <ShellGlobalAlert />

        <section className="shell-content">
          <Outlet />
        </section>
      </div>
    </div>
  )
}

