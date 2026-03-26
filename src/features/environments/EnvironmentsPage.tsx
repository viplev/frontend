import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import { EnvironmentsLoadError, listEnvironments } from './service'

function EnvironmentPlatform({ type }: { type: EnvironmentDTO['type'] }) {
  return <span className="environment-type">{type}</span>
}

function EnvironmentCard({ environment }: { environment: EnvironmentDTO }) {
  const navigate = useNavigate()

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
        <EnvironmentPlatform type={environment.type} />
      </header>
      <p>{environment.description?.trim() || 'No description provided.'}</p>
    </article>
  )
}

export function EnvironmentsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState<Array<EnvironmentDTO>>([])
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
          {sortedItems.map((environment) => (
            <EnvironmentCard
              key={environment.id ?? `${environment.name}-${environment.type}`}
              environment={environment}
            />
          ))}
        </section>
      </AsyncStateView>
    </article>
  )
}

