import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import { EnvironmentsLoadError, listEnvironments } from './service'

function EnvironmentPlatform({ type }: { type: EnvironmentDTO['type'] }) {
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

