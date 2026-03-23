import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import { EnvironmentsLoadError, listEnvironments } from './service'

function DockerLogo() {
  return (
    <svg
      className="environment-platform-icon"
      viewBox="0 0 32 24"
      aria-hidden="true"
    >
      <rect x="3" y="9" width="4" height="4" rx="0.8" />
      <rect x="8" y="9" width="4" height="4" rx="0.8" />
      <rect x="13" y="9" width="4" height="4" rx="0.8" />
      <rect x="18" y="9" width="4" height="4" rx="0.8" />
      <rect x="8" y="4" width="4" height="4" rx="0.8" />
      <rect x="13" y="4" width="4" height="4" rx="0.8" />
      <rect x="18" y="4" width="4" height="4" rx="0.8" />
      <path d="M23 12c1.5 0 2.7-.2 3.7-1.1.5.8.4 2.1-.2 3.2-.9 1.7-2.6 3-5.1 3H10.6c-3 0-5-1.6-5.6-4h18z" />
    </svg>
  )
}

function KubernetesLogo() {
  return (
    <svg
      className="environment-platform-icon"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path d="M16 3 26.8 9.2v13.6L16 29 5.2 22.8V9.2z" />
      <circle cx="16" cy="16" r="5.3" />
      <path d="m16 6.8 1.5 4.5M25.2 12.1l-4.6 1.2M22.7 22.8l-3.4-3.3M9.3 22.8l3.4-3.3M6.8 12.1l4.6 1.2M16 25.2l1.5-4.5M16 6.8l-1.5 4.5M25.2 12.1l-3.4 3.3M9.3 22.8l4.6-1.2M6.8 12.1l3.4 3.3M16 25.2l-1.5-4.5M22.7 22.8l-4.6-1.2" />
    </svg>
  )
}

function EnvironmentPlatform({ type }: { type: EnvironmentDTO['type'] }) {
  if (type === 'docker') {
    return (
      <span className="environment-platform" title="Docker">
        <DockerLogo />
        <span className="sr-only">Docker</span>
      </span>
    )
  }

  if (type === 'kubernetes') {
    return (
      <span className="environment-platform" title="Kubernetes">
        <KubernetesLogo />
        <span className="sr-only">Kubernetes</span>
      </span>
    )
  }

  return <span className="environment-type">{type}</span>
}

function EnvironmentCard({ environment }: { environment: EnvironmentDTO }) {
  return (
    <article className="environment-card">
      <header className="environment-card-header">
        <h2>{environment.name}</h2>
        <EnvironmentPlatform type={environment.type} />
      </header>
      <p>{environment.description?.trim() || 'No description provided.'}</p>
    </article>
  )
}

export function EnvironmentsPage() {
  const [items, setItems] = useState<Array<EnvironmentDTO>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <h1>Environments</h1>
      <p className="auth-text">
        View all environments and pick one to manage services and benchmark runs.
      </p>

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

