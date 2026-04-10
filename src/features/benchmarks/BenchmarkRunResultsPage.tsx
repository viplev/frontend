import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { BenchmarkRunDerivedDTO } from '../../generated/openapi/models/BenchmarkRunDerivedDTO'
import type { BenchmarkRunRawDTO } from '../../generated/openapi/models/BenchmarkRunRawDTO'
import { getEnvironmentDetails } from '../environments/service'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import {
  BenchmarkRunDetailsError,
  BenchmarkRunRawError,
  getBenchmark,
  getBenchmarkRunDetails,
  getBenchmarkRunRaw,
} from './service'
import {
  formatRunStatus,
  formatRuntimeDuration,
  formatTimestamp,
} from './format'

function formatMetric(value?: number, unit = ''): string {
  if (value == null || Number.isNaN(value)) {
    return 'n/a'
  }

  return `${value.toFixed(2)}${unit}`
}

function formatRatePercent(value?: number): string {
  if (value == null || Number.isNaN(value)) {
    return 'n/a'
  }

  return `${(value * 100).toFixed(2)}%`
}

function formatBytes(value?: number): string {
  if (value == null || Number.isNaN(value)) {
    return 'n/a'
  }

  if (value <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 100 ? 0 : size >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

function getDerivedErrorMessage(error: unknown): string {
  if (error instanceof BenchmarkRunDetailsError) {
    return error.message
  }

  return 'Unable to load derived run summary right now.'
}

function getRawErrorMessage(error: unknown): string {
  if (error instanceof BenchmarkRunRawError) {
    return error.message
  }

  return 'Unable to load raw run data right now.'
}

export function BenchmarkRunResultsPage() {
  const { environmentId = '', benchmarkId = '', runId = '' } = useParams<{
    environmentId: string
    benchmarkId: string
    runId: string
  }>()
  const location = useLocation()
  const navigate = useNavigate()

  const [environmentName, setEnvironmentName] = useState<string | null>(null)
  const [benchmarkName, setBenchmarkName] = useState<string | null>(null)
  const [derivedData, setDerivedData] = useState<BenchmarkRunDerivedDTO | null>(null)
  const [rawData, setRawData] = useState<BenchmarkRunRawDTO | null>(null)
  const [derivedError, setDerivedError] = useState<string | null>(null)
  const [rawError, setRawError] = useState<string | null>(null)
  const [fatalError, setFatalError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryAttempt, setRetryAttempt] = useState(0)

  const environmentLabel = (environmentName ?? environmentId).trim() || 'n/a'
  const benchmarkLabel = (benchmarkName ?? benchmarkId).trim() || 'n/a'

  useEffect(() => {
    if (!environmentId.trim() || !benchmarkId.trim() || !runId.trim()) {
      setFatalError('Environment ID, benchmark ID, or run ID is missing.')
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setFatalError(null)
    setDerivedError(null)
    setRawError(null)
    setDerivedData(null)
    setRawData(null)

    const load = async () => {
      const [environmentResult, benchmarkResult, derivedResult, rawResult] =
        await Promise.allSettled([
          getEnvironmentDetails(environmentId, controller.signal),
          getBenchmark(environmentId, benchmarkId, controller.signal),
          getBenchmarkRunDetails(environmentId, benchmarkId, runId, controller.signal),
          getBenchmarkRunRaw(environmentId, benchmarkId, runId, controller.signal),
        ])

      if (controller.signal.aborted) {
        return
      }

      if (environmentResult.status === 'fulfilled') {
        setEnvironmentName(environmentResult.value.name?.trim() || environmentId)
      } else {
        setEnvironmentName(environmentId)
      }

      if (benchmarkResult.status === 'fulfilled') {
        setBenchmarkName(benchmarkResult.value.name?.trim() || benchmarkId)
      } else {
        setBenchmarkName(benchmarkId)
      }

      let hasAtLeastOneDataSet = false

      if (derivedResult.status === 'fulfilled') {
        setDerivedData(derivedResult.value)
        hasAtLeastOneDataSet = true
      } else {
        setDerivedError(getDerivedErrorMessage(derivedResult.reason))
      }

      if (rawResult.status === 'fulfilled') {
        setRawData(rawResult.value)
        hasAtLeastOneDataSet = true
      } else {
        setRawError(getRawErrorMessage(rawResult.reason))
      }

      if (!hasAtLeastOneDataSet) {
        setFatalError('Unable to load run results right now.')
      }

      setIsLoading(false)
    }

    void load()

    return () => controller.abort()
  }, [benchmarkId, environmentId, retryAttempt, runId])

  const run = derivedData?.run
  const httpMetrics = useMemo(
    () =>
      [...(derivedData?.http ?? [])].sort(
        (a, b) => (b.totalRequests ?? 0) - (a.totalRequests ?? 0),
      ),
    [derivedData],
  )
  const hostMetrics = useMemo(
    () => [...(derivedData?.hosts ?? [])].sort((a, b) => (a.hostName ?? '').localeCompare(b.hostName ?? '')),
    [derivedData],
  )
  const vus = derivedData?.vus

  const rawHosts = rawData?.timeSeries?.hosts ?? []
  const rawHostPoints = rawHosts.reduce(
    (sum, host) => sum + (host.dataPoints?.length ?? 0),
    0,
  )
  const rawServiceCount = rawHosts.reduce(
    (sum, host) => sum + (host.services?.length ?? 0),
    0,
  )
  const rawServicePoints = rawHosts.reduce(
    (sum, host) =>
      sum +
      (host.services ?? []).reduce(
        (serviceSum, service) => serviceSum + (service.dataPoints?.length ?? 0),
        0,
      ),
    0,
  )
  const rawK6Points = rawData?.timeSeries?.k6?.dataPoints?.length ?? 0
  const rawJson = useMemo(
    () => (rawData ? JSON.stringify(rawData, null, 2) : ''),
    [rawData],
  )

  const handleBackNavigation = () => {
    const backTarget = (location.state as { from?: string } | null)?.from
    if (typeof backTarget === 'string' && backTarget.startsWith('/')) {
      navigate(backTarget)
      return
    }

    const fallbackPath =
      environmentId.trim() && benchmarkId.trim()
        ? `/environments/${environmentId}/benchmarks/${benchmarkId}`
        : '/environments'
    navigate(fallbackPath)
  }

  return (
    <article className="shell-page">
      <div className="run-results-top-row">
        <div>
          <h1>Run results summary</h1>
          <p className="auth-text run-results-byline">
            Derived metrics are shown first, with expandable raw payload details below.
          </p>
        </div>
        <button
          type="button"
          className="shell-alert-dismiss"
          onClick={handleBackNavigation}
        >
          Back
        </button>
      </div>

      <AsyncStateView
        isLoading={isLoading}
        error={fatalError}
        isEmpty={false}
        onRetry={() => setRetryAttempt((current) => current + 1)}
        loadingTitle="Loading run results"
      >
        {derivedError ? (
          <p className="auth-notice auth-notice-error benchmark-copy-feedback" role="alert">
            {derivedError}
          </p>
        ) : null}

        {rawError ? (
          <p className="auth-notice auth-notice-error benchmark-copy-feedback" role="alert">
            {rawError}
          </p>
        ) : null}

        <section className="run-results-context-section">
          <section className="environment-detail-grid run-results-context-grid">
            <div>
              <p className="shell-context-label">Environment</p>
              <p className="shell-context-value">{environmentLabel}</p>
            </div>
            <div>
              <p className="shell-context-label">Benchmark</p>
              <p className="shell-context-value">{benchmarkLabel}</p>
            </div>
            <div>
              <p className="shell-context-label">Run</p>
              <p className="shell-context-value">{runId || 'n/a'}</p>
            </div>
            <div>
              <p className="shell-context-label">Status</p>
              <p className="shell-context-value">{formatRunStatus(run?.status)}</p>
            </div>
            <div>
              <p className="shell-context-label">Started at</p>
              <p className="shell-context-value">{formatTimestamp(run?.startedAt)}</p>
            </div>
            <div>
              <p className="shell-context-label">Ended at</p>
              <p className="shell-context-value">{formatTimestamp(run?.finishedAt)}</p>
            </div>
            <div>
              <p className="shell-context-label">Runtime</p>
              <p className="shell-context-value">
                {formatRuntimeDuration(run?.startedAt, run?.finishedAt) ?? 'n/a'}
              </p>
            </div>
            <div>
              <p className="shell-context-label">Status reason</p>
              <p className="shell-context-value">{run?.statusReason?.trim() || 'n/a'}</p>
            </div>
          </section>
        </section>

        <section className="run-results-section">
          <h2>Derived summary</h2>
          <div className="run-results-cards">
            <article className="run-results-card">
              <h3>VUs</h3>
              {vus ? (
                <>
                  <p>Avg: {formatMetric(vus.avg)}</p>
                  <p>Min: {formatMetric(vus.min)}</p>
                  <p>Max: {formatMetric(vus.max)}</p>
                </>
              ) : (
                <p>VUs summary is not available for this run.</p>
              )}
            </article>
            <article className="run-results-card">
              <h3>Hosts</h3>
              {hostMetrics.length === 0 ? (
                <p>Host resource summary is not available for this run.</p>
              ) : (
                <>
                  <p>Total hosts: {hostMetrics.length}</p>
                  <p>
                    Total services:{' '}
                    {hostMetrics.reduce(
                      (sum, host) => sum + (host.services?.length ?? 0),
                      0,
                    )}
                  </p>
                </>
              )}
            </article>
            <article className="run-results-card">
              <h3>HTTP groups</h3>
              {httpMetrics.length === 0 ? (
                <p>HTTP summary is not available for this run.</p>
              ) : (
                <>
                  <p>Total groups: {httpMetrics.length}</p>
                  <p>
                    Total requests:{' '}
                    {httpMetrics.reduce(
                      (sum, metric) => sum + (metric.totalRequests ?? 0),
                      0,
                    )}
                  </p>
                </>
              )}
            </article>
          </div>
        </section>

        <section className="run-results-section">
          <h2>HTTP details</h2>
          {httpMetrics.length === 0 ? (
            <p className="run-results-placeholder">
              No HTTP metrics are available for this run.
            </p>
          ) : (
            <div className="run-results-table-wrap">
              <table className="run-results-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Requests</th>
                    <th>RPS</th>
                    <th>Error rate</th>
                    <th>Avg duration</th>
                    <th>P95 duration</th>
                  </tr>
                </thead>
                <tbody>
                  {httpMetrics.map((metric) => (
                    <tr key={`${metric.requestGroup ?? ''}|${metric.url ?? ''}`}>
                      <td>{metric.requestGroup ?? metric.url ?? 'Request group'}</td>
                      <td>{metric.totalRequests ?? 0}</td>
                      <td>{formatMetric(metric.requestsPerSecond)}</td>
                      <td>{formatRatePercent(metric.errorRate)}</td>
                      <td>{formatMetric(metric.duration?.avg, ' ms')}</td>
                      <td>{formatMetric(metric.duration?.percentiles?.p95, ' ms')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="run-results-section">
          <h2>Host resources</h2>
          {hostMetrics.length === 0 ? (
            <p className="run-results-placeholder">
              No host resource summaries are available for this run.
            </p>
          ) : (
            <ul className="run-results-host-list">
              {hostMetrics.map((host) => (
                <li key={`${host.hostId ?? ''}|${host.hostName ?? ''}`}>
                  <h3>{host.hostName ?? host.hostId ?? 'Host'}</h3>
                  <p>
                    CPU avg {formatMetric(host.resource?.cpu?.avg, '%')} | Memory avg{' '}
                    {formatMetric(host.resource?.memory?.avg, '%')}
                  </p>
                  <p>
                    Net in {formatBytes(host.resource?.networkInTotalBytes)} | Net out{' '}
                    {formatBytes(host.resource?.networkOutTotalBytes)}
                  </p>
                  <p>Services: {host.services?.length ?? 0}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="run-results-section">
          <h2>Raw payload</h2>
          {rawData ? (
            <div className="run-results-raw-sections">
              <details className="run-results-raw-detail" open>
                <summary>Time-series overview</summary>
                <div className="run-results-raw-grid">
                  <p>Hosts: {rawHosts.length}</p>
                  <p>Host data points: {rawHostPoints}</p>
                  <p>Services: {rawServiceCount}</p>
                  <p>Service data points: {rawServicePoints}</p>
                  <p>K6 data points: {rawK6Points}</p>
                </div>
              </details>

              <details className="run-results-raw-detail">
                <summary>K6 data points ({rawK6Points})</summary>
                <pre className="run-results-raw-json">
                  {JSON.stringify(rawData.timeSeries?.k6?.dataPoints ?? [], null, 2)}
                </pre>
              </details>

              <details className="run-results-raw-detail">
                <summary>Host and service data ({rawHosts.length} hosts)</summary>
                <pre className="run-results-raw-json">
                  {JSON.stringify(rawData.timeSeries?.hosts ?? [], null, 2)}
                </pre>
              </details>

              <details className="run-results-raw-detail">
                <summary>Full raw payload</summary>
                <pre className="run-results-raw-json">{rawJson}</pre>
              </details>
            </div>
          ) : (
            <p className="run-results-placeholder">
              Raw payload is not available for this run.
            </p>
          )}
        </section>
      </AsyncStateView>
    </article>
  )
}
