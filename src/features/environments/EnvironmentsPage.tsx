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
import { getTrimmedString, isEnvironmentLike, resolveAgentStatus } from './utils'

function EnvironmentPlatform({
  type,
}: {
  type: EnvironmentDTO['type']
}) {
  return <span className="environment-type">{type}</span>
}

type EnvironmentListItem = {
  environment: EnvironmentDTO
  stableKey: string
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
  const environmentId = getTrimmedString(environment.id)
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
    if (environmentId) {
      navigate(`/environments/${environmentId}`)
    }
  }

  return (
    <article
      className="environment-card"
      onClick={handleClick}
      style={{ cursor: environmentId ? 'pointer' : 'default' }}
    >
      <header className="environment-card-header">
        <h2>{getTrimmedString(environment.name) || environmentId || 'Unnamed environment'}</h2>
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
      <p>{getTrimmedString(environment.description) || 'No description provided.'}</p>
    </article>
  )
}

export function EnvironmentsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState<Array<EnvironmentListItem>>([])
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
      const validEnvironments = environments.filter(isEnvironmentLike)
      const keyedEnvironments = validEnvironments.map((environment, index) => {
        const environmentId = getTrimmedString(environment.id)
        const environmentName = getTrimmedString(environment.name)
        const fallbackDiscriminator = `${environmentName || 'environment'}-${environment.type}-${index}`
        return {
          environment,
          stableKey: environmentId || fallbackDiscriminator,
        }
      })
      setItems(keyedEnvironments)

      const activeRunEntries = await Promise.all(
        keyedEnvironments.map(async ({ environment }) => {
          const environmentId = getTrimmedString(environment.id)
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
        setError('Unable to process environments right now.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        getTrimmedString(a.environment.name).localeCompare(
          getTrimmedString(b.environment.name),
        ),
      ),
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
          {sortedItems.map(({ environment, stableKey }) => {
            const environmentId = getTrimmedString(environment.id)
            return (
              <EnvironmentCard
                key={stableKey}
                environment={environment}
                hasActiveRuns={Boolean(
                  environmentId ? activeRunByEnvironmentId[environmentId] : false,
                )}
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

