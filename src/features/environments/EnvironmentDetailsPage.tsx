import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { BenchmarkDTO } from '../../generated/openapi/models/BenchmarkDTO'
import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'
import type { EnvironmentRunSummaryDTO } from '../../generated/openapi/models/EnvironmentRunSummaryDTO'
import type { ServiceDTO } from '../../generated/openapi/models/ServiceDTO'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import { listActiveEnvironmentRuns, listBenchmarks } from '../benchmarks/service'
import {
  EnvironmentDetailsError,
  getEnvironmentDetails,
  getEnvironmentServices,
} from './service'

const REFRESH_INTERVAL_MS = 15000

function formatMemory(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return 'n/a'
  }

  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`
  }

  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(0)} MB`
}

function formatTimestamp(value?: Date): string {
  if (!value) {
    return 'Never'
  }

  return new Date(value).toLocaleString()
}

export function EnvironmentDetailsPage() {
  const { environmentId = '' } = useParams<{ environmentId: string }>()
  const navigate = useNavigate()
  const [environment, setEnvironment] = useState<EnvironmentDTO | null>(null)
  const [benchmarks, setBenchmarks] = useState<Array<BenchmarkDTO>>([])
  const [activeRunsByBenchmarkId, setActiveRunsByBenchmarkId] = useState<
    Record<string, EnvironmentRunSummaryDTO>
  >({})
  const [services, setServices] = useState<Array<ServiceDTO>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(
    async (signal: AbortSignal, isInitialLoad = true) => {
      if (!environmentId.trim()) {
        setError('Environment ID is missing or invalid.')
        setNotFound(false)
        setIsLoading(false)
        return
      }

      if (isInitialLoad) {
        setIsLoading(true)
      }
      setError(null)
      setNotFound(false)

      try {
        const [detailsResult, benchmarksResult, runsResult, servicesResult] =
          await Promise.allSettled([
          getEnvironmentDetails(environmentId),
          listBenchmarks(environmentId),
          listActiveEnvironmentRuns(environmentId),
          getEnvironmentServices(environmentId),
        ])

        // Only update state if this request hasn't been aborted
        if (signal.aborted) {
          return
        }

        // Handle environment details result
        if (detailsResult.status === 'rejected') {
          const nextError = detailsResult.reason

          if (nextError instanceof EnvironmentDetailsError) {
            setError(nextError.message)
            setNotFound(nextError.notFound)
          } else {
            setError('Unable to load environment details right now.')
          }

          return
        }

        // Details succeeded - update environment
        setEnvironment(detailsResult.value)

        if (benchmarksResult.status === 'fulfilled') {
          setBenchmarks(benchmarksResult.value)
        } else {
          setBenchmarks([])
        }

        if (runsResult.status === 'fulfilled') {
          const nextActiveRuns: Record<string, EnvironmentRunSummaryDTO> = {}
          for (const run of runsResult.value) {
            if (run.benchmarkId && !nextActiveRuns[run.benchmarkId]) {
              nextActiveRuns[run.benchmarkId] = run
            }
          }
          setActiveRunsByBenchmarkId(nextActiveRuns)
        } else {
          setActiveRunsByBenchmarkId({})
        }

        // Handle services result (non-blocking)
        if (servicesResult.status === 'fulfilled') {
          setServices(servicesResult.value)
        }
        // If services failed, we keep existing services and don't show error
        // The empty state will show if services array is empty
      } catch {
        // This catch should not be reached with Promise.allSettled
        // But keeping it as a safety net
        if (signal.aborted) {
          return
        }

        setError('An unexpected error occurred.')
      } finally {
        if (!signal.aborted) {
          setIsLoading(false)
        }
      }
    },
    [environmentId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal, true)

    return () => {
      controller.abort()
    }
  }, [load])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setInterval(() => {
      // Stop polling if we've confirmed a 404
      if (notFound) {
        return
      }
      void load(controller.signal, false)
    }, REFRESH_INTERVAL_MS)

    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [load, notFound])

  const sortedServices = useMemo(
    () =>
      [...services].sort((a, b) =>
        (a.serviceName ?? '').localeCompare(b.serviceName ?? ''),
      ),
    [services],
  )

  const sortedBenchmarks = useMemo(
    () => [...benchmarks].sort((a, b) => a.name.localeCompare(b.name)),
    [benchmarks],
  )

  if (notFound) {
    return (
      <article className="shell-page">
        <h1>Environment not found</h1>
        <p className="auth-text">
          We could not find an environment with id <code>{environmentId}</code>.
        </p>
        <Link className="auth-button environment-inline-action" to="/environments">
          Back to environments
        </Link>
      </article>
    )
  }

  return (
    <article className="shell-page">
      <div className="environment-page-header">
        <div>
          <h1>{environment?.name ?? 'Environment details'}</h1>
          <p className="auth-text">
            Benchmarks and services refresh automatically every 15 seconds.
          </p>
        </div>
        <Link className="shell-alert-dismiss" to="/environments">
          Back
        </Link>
      </div>

      <AsyncStateView
        isLoading={isLoading}
        error={error}
        isEmpty={false}
        onRetry={() => {
          const controller = new AbortController()
          void load(controller.signal, true)
        }}
        loadingTitle="Loading environment details"
      >
        <section className="environment-detail-grid">
          <div>
            <p className="shell-context-label">Type</p>
            <p className="shell-context-value">{environment?.type ?? 'n/a'}</p>
          </div>
          <div>
            <p className="shell-context-label">Agent last seen</p>
            <p className="shell-context-value">
              {formatTimestamp(environment?.agentLastSeenAt)}
            </p>
          </div>
          <div>
            <p className="shell-context-label">Created</p>
            <p className="shell-context-value">
              {formatTimestamp(environment?.createdAt)}
            </p>
          </div>
        </section>

        <section className="environment-benchmarks-section">
          <h2>Benchmarks</h2>
          <AsyncStateView
            isLoading={false}
            error={null}
            isEmpty={sortedBenchmarks.length === 0}
            emptyTitle="No benchmarks yet"
            emptyDescription="Create a benchmark to start running scenarios in this environment."
          >
            <div className="environment-benchmarks-table-wrap">
              <table className="environment-benchmarks-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBenchmarks.map((benchmark) => {
                    const isRunning = Boolean(
                      benchmark.id ? activeRunsByBenchmarkId[benchmark.id] : null,
                    )

                    return (
                      <tr key={benchmark.id ?? benchmark.name}>
                        <td>{benchmark.name}</td>
                        <td>{benchmark.description?.trim() || 'No description provided.'}</td>
                        <td>
                          {isRunning ? (
                            <span className="benchmark-status-active">Active run</span>
                          ) : (
                            'Idle'
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="auth-button benchmark-table-action"
                            onClick={() => navigate('/benchmarks')}
                            disabled={isRunning || !benchmark.id}
                            title={
                              isRunning
                                ? 'This benchmark is already running in this environment.'
                                : undefined
                            }
                          >
                            Start benchmark
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </AsyncStateView>
        </section>

        <section className="environment-services-section">
          <h2>Registered services</h2>
          <AsyncStateView
            isLoading={false}
            error={null}
            isEmpty={sortedServices.length === 0}
            emptyTitle="No services registered"
            emptyDescription="No services have reported into this environment yet."
          >
            <div className="environment-services-table-wrap">
              <table className="environment-services-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Image</th>
                    <th>CPU limit</th>
                    <th>Memory limit</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedServices.map((service, index) => (
                    <tr key={service.id ?? service.serviceName ?? `service-${index}`}>
                      <td>{service.serviceName ?? 'Unnamed service'}</td>
                      <td>{service.imageName ?? service.imageSha ?? 'n/a'}</td>
                      <td>{service.cpuLimit ?? 'n/a'}</td>
                      <td>{formatMemory(service.memoryLimitBytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AsyncStateView>
        </section>
      </AsyncStateView>
    </article>
  )
}

