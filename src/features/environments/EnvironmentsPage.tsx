import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'
import {
  EnvironmentRunSummaryDTOStatusEnum,
  type EnvironmentRunSummaryDTO,
} from '../../generated/openapi/models/EnvironmentRunSummaryDTO'
import { listActiveEnvironmentRuns } from '../benchmarks/service'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import { EnvironmentsLoadError, listEnvironments } from './service'
import { formatTimestamp } from './format'

const AGENT_ACTIVE_THRESHOLD_MINUTES = 5

function EnvironmentPlatform({
  type,
}: {
  type: EnvironmentDTO['type']
}) {
  return <span className="environment-type">{type}</span>
}

function resolveAgentStatus(lastSeenAt?: Date): { label: string; variant: 'active' | 'inactive' | 'never' } {
  if (!lastSeenAt) {
    return { label: 'Agent: Never seen', variant: 'never' }
  }

  const minutesSinceSeen = (Date.now() - new Date(lastSeenAt).getTime()) / 60000
  if (minutesSinceSeen <= AGENT_ACTIVE_THRESHOLD_MINUTES) {
    return { label: 'Agent: Active', variant: 'active' }
  }

  return { label: 'Agent: Inactive', variant: 'inactive' }
}

function hasRunningOrPendingRun(runs: Array<EnvironmentRunSummaryDTO>): boolean {
  return runs.some(
    (run) =>
      run.status === EnvironmentRunSummaryDTOStatusEnum.PendingStart ||
      run.status === EnvironmentRunSummaryDTOStatusEnum.Started ||
      run.status === EnvironmentRunSummaryDTOStatusEnum.PendingStop,
  )
}

function EnvironmentCard({
  environment,
  hasActiveRuns,
  benchmarkStatusKnown,
}: {
  environment: EnvironmentDTO
  hasActiveRuns: boolean
  benchmarkStatusKnown: boolean
}) {
  const navigate = useNavigate()
  const agentStatus = resolveAgentStatus(environment.agentLastSeenAt)
  const runsStatusLabel = benchmarkStatusKnown
    ? hasActiveRuns
      ? 'Benchmarks: Running'
      : 'Benchmarks: Idle'
    : 'Benchmarks: Unknown'
  const runStatusVariant = benchmarkStatusKnown
    ? hasActiveRuns
      ? 'environment-card-indicator-running'
      : 'environment-card-indicator-idle'
    : 'environment-card-indicator-unknown'
  const runsStatusTitle = benchmarkStatusKnown
    ? undefined
    : 'Unable to determine benchmark run status right now.'

  const handleClick = () => {
    if (environment.id) {
      navigate(`/environments/${environment.id}`)
    }
  }

  return (
    <article
      className="environment-card"
      onClick={handleClick}
      style={{ cursor: environment.id ? 'pointer' : 'default' }}
    >
      <header className="environment-card-header">
        <h2>{environment.name}</h2>
        <div className="environment-card-meta">
          <EnvironmentPlatform type={environment.type} />
          <div className="environment-card-indicators">
            <span
              className={`environment-card-indicator environment-card-indicator-${agentStatus.variant}`}
              title={`Last seen: ${formatTimestamp(environment.agentLastSeenAt)}`}
            >
              {agentStatus.label}
            </span>
            <span
              className={`environment-card-indicator ${runStatusVariant}`}
              title={runsStatusTitle}
            >
              {runsStatusLabel}
            </span>
          </div>
        </div>
      </header>
      <p>{environment.description?.trim() || 'No description provided.'}</p>
    </article>
  )
}

export function EnvironmentsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState<Array<EnvironmentDTO>>([])
  const [activeRunByEnvironmentId, setActiveRunByEnvironmentId] = useState<Record<string, boolean>>(
    {},
  )
  const [benchmarkStatusKnownByEnvironmentId, setBenchmarkStatusKnownByEnvironmentId] = useState<
    Record<string, boolean>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createdNotice, setCreatedNotice] = useState<{
    name: string
    token: string | null
    agentCommand: string | null
  } | null>(() => {
    const state = location.state as
      | {
          createdEnvironment?: {
            name: string
            token: string | null
            agentCommand: string | null
          }
        }
      | undefined
    return state?.createdEnvironment ?? null
  })

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const environments = await listEnvironments()
      setItems(environments)

      const activeRunEntries = await Promise.all(
        environments.map(async (environment) => {
          const environmentId = environment.id?.trim()
          if (!environmentId) {
            return [environmentId, false, false] as const
          }

          try {
            const runs = await listActiveEnvironmentRuns(environmentId)
            return [environmentId, hasRunningOrPendingRun(runs), true] as const
          } catch {
            return [environmentId, false, false] as const
          }
        }),
      )

      const nextActiveRunByEnvironmentId: Record<string, boolean> = {}
      const nextBenchmarkStatusKnownByEnvironmentId: Record<string, boolean> = {}
      for (const [environmentId, hasActive, isKnown] of activeRunEntries) {
        if (environmentId) {
          nextActiveRunByEnvironmentId[environmentId] = hasActive
          nextBenchmarkStatusKnownByEnvironmentId[environmentId] = isKnown
        }
      }
      setActiveRunByEnvironmentId(nextActiveRunByEnvironmentId)
      setBenchmarkStatusKnownByEnvironmentId(nextBenchmarkStatusKnownByEnvironmentId)
    } catch (nextError: unknown) {
      if (nextError instanceof EnvironmentsLoadError) {
        setError(nextError.message)
      } else {
        setError('Unable to load environments right now.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  )

  return (
    <article className="shell-page">
      <div className="environment-page-header">
        <div>
          <h1>Environments</h1>
          <p className="auth-text">
            View all environments and pick one to manage services and benchmark runs.
          </p>
        </div>
        <button
          type="button"
          className="auth-button environment-create-cta"
          onClick={() => navigate('/environments/new')}
        >
          Create environment
        </button>
      </div>

      {createdNotice ? (
        <section className="environment-created-notice" role="status">
          <p>
            <strong>{createdNotice.name}</strong> was created successfully.
          </p>
          {createdNotice.token ? (
            <p className="environment-created-detail">
              Agent token: <code>{createdNotice.token}</code>
            </p>
          ) : null}
          {createdNotice.agentCommand ? (
            <div className="environment-created-command-wrap">
              <p className="environment-created-detail">Agent install command:</p>
              <pre className="environment-created-command">
                <code>{createdNotice.agentCommand}</code>
              </pre>
            </div>
          ) : null}
          <button
            type="button"
            className="shell-alert-dismiss"
            onClick={() => {
              setCreatedNotice(null)
              navigate(location.pathname, { replace: true })
            }}
          >
            Dismiss
          </button>
        </section>
      ) : null}

      <AsyncStateView
        isLoading={isLoading}
        error={error}
        isEmpty={!isLoading && !error && sortedItems.length === 0}
        onRetry={load}
        emptyTitle="No environments yet"
        emptyDescription="Create an environment to start onboarding agents and running benchmarks."
        loadingTitle="Loading environments"
      >
        <section className="environment-list">
          {sortedItems.map((environment) => {
            const environmentId = environment.id?.trim() ?? ''
            return (
            <EnvironmentCard
              key={environment.id ?? `${environment.name}-${environment.type}`}
              environment={environment}
              hasActiveRuns={Boolean(environmentId ? activeRunByEnvironmentId[environmentId] : false)}
              benchmarkStatusKnown={Boolean(
                environmentId ? benchmarkStatusKnownByEnvironmentId[environmentId] : false,
              )}
            />
            )
          })}
        </section>
      </AsyncStateView>
    </article>
  )
}

