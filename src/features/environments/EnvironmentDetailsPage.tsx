import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
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
  const location = useLocation()
  const [environment, setEnvironment] = useState<EnvironmentDTO | null>(null)
  const [benchmarks, setBenchmarks] = useState<Array<BenchmarkDTO>>([])
  const [activeRunsByBenchmarkId, setActiveRunsByBenchmarkId] = useState<
    Record<string, EnvironmentRunSummaryDTO>
  >({})
  const [services, setServices] = useState<Array<ServiceDTO>>([])
  const [isBenchmarksLoading, setIsBenchmarksLoading] = useState(true)
  const [benchmarksError, setBenchmarksError] = useState<string | null>(null)
  const [isServicesLoading, setIsServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [benchmarkNotice, setBenchmarkNotice] = useState<{
    type: 'created' | 'updated'
    name: string
  } | null>(() => {
    const state = location.state as
      | {
          benchmarkNotice?: {
            type: 'created' | 'updated'
            name: string
          }
        }
      | undefined
    return state?.benchmarkNotice ?? null
  })

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
        setIsBenchmarksLoading(true)
        setIsServicesLoading(true)
      }
      setBenchmarksError(null)
      setServicesError(null)
      setError(null)
      setNotFound(false)

      try {
        const detailsResult = await getEnvironmentDetails(environmentId)

        if (signal.aborted) {
          return
        }

        setEnvironment(detailsResult)
        if (isInitialLoad) {
          setIsLoading(false)
        }

        const [benchmarksResult, runsResult, servicesResult] =
          await Promise.allSettled([
            listBenchmarks(environmentId),
            listActiveEnvironmentRuns(environmentId),
            getEnvironmentServices(environmentId),
          ])

        // Only update state if this request hasn't been aborted
        if (signal.aborted) {
          return
        }

        if (benchmarksResult.status === 'fulfilled') {
          setBenchmarks(benchmarksResult.value)
          setBenchmarksError(null)
        } else {
          setBenchmarksError('Unable to load benchmarks right now.')
        }

        if (runsResult.status === 'fulfilled') {
          const nextActiveRuns: Record<string, EnvironmentRunSummaryDTO> = {}
          for (const run of runsResult.value) {
            if (run.benchmarkId && !nextActiveRuns[run.benchmarkId]) {
              nextActiveRuns[run.benchmarkId] = run
            }
          }
          setActiveRunsByBenchmarkId(nextActiveRuns)
        }
        setIsBenchmarksLoading(false)

        // Handle services result (non-blocking)
        if (servicesResult.status === 'fulfilled') {
          setServices(servicesResult.value)
          setServicesError(null)
        } else {
          setServicesError('Unable to load services right now.')
        }
        setIsServicesLoading(false)
      } catch (nextError: unknown) {
        if (signal.aborted) {
          return
        }

        setBenchmarksError(null)
        setServicesError(null)

        setIsBenchmarksLoading(false)
        setIsServicesLoading(false)

        if (nextError instanceof EnvironmentDetailsError) {
          setError(nextError.message)
          setNotFound(nextError.notFound)
        } else {
          setError('Unable to load environment details right now.')
        }
      } finally {
        if (!signal.aborted) {
          if (isInitialLoad) {
            setIsLoading(false)
          }
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

  const benchmarkNoticeCard = benchmarkNotice ? (
    <section className="environment-created-notice" role="status">
      <p>
        Benchmark <strong>{benchmarkNotice.name}</strong>{' '}
        {benchmarkNotice.type === 'created' ? 'was created' : 'was updated'} successfully.
      </p>
      <button
        type="button"
        className="shell-alert-dismiss environment-created-dismiss"
        onClick={() => {
          setBenchmarkNotice(null)
          navigate(location.pathname, { replace: true })
        }}
      >
        Dismiss
      </button>
    </section>
  ) : null

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
          <div className="benchmark-section-header">
            <h2>Benchmarks</h2>
            <button
              type="button"
              className="auth-button benchmark-section-action"
              onClick={() => navigate(`/environments/${environmentId}/benchmarks/new`)}
            >
              Create benchmark
            </button>
          </div>
          {benchmarkNotice ? benchmarkNoticeCard : null}
          <AsyncStateView
            isLoading={isBenchmarksLoading}
            error={benchmarksError}
            isEmpty={false}
          >
            {sortedBenchmarks.length === 0 ? (
              <Link
                className="async-state async-state-empty benchmark-empty-cta"
                to={`/environments/${environmentId}/benchmarks/new`}
              >
                <h2>No benchmarks yet</h2>
                <p>Create a benchmark to start running scenarios in this environment.</p>
              </Link>
            ) : (
              <div className="environment-benchmarks-table-wrap">
                <table className="environment-benchmarks-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
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
                            <div className="benchmark-table-actions">
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
                              <button
                                type="button"
                                className="shell-alert-dismiss benchmark-table-action-secondary"
                                onClick={() =>
                                  navigate(
                                    `/environments/${environmentId}/benchmarks/${benchmark.id}/edit`,
                                  )
                                }
                                disabled={!benchmark.id}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AsyncStateView>
        </section>

        <section className="environment-services-section">
          <h2>Registered services</h2>
          <AsyncStateView
            isLoading={isServicesLoading}
            error={servicesError}
            isEmpty={!isServicesLoading && !servicesError && sortedServices.length === 0}
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

