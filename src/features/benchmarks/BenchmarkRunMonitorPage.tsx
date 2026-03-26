import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEnvironmentDetails } from '../environments/service'
import {
  BenchmarkRunDetailsError,
  getBenchmark,
  getBenchmarkRunDetails,
  stopBenchmarkRun,
  StopBenchmarkRunError,
} from './service'
import {
  BenchmarkRunDTOStatusEnum,
  type BenchmarkRunDTO,
} from '../../generated/openapi/models/BenchmarkRunDTO'
import type { BenchmarkRunDerivedDTO } from '../../generated/openapi/models/BenchmarkRunDerivedDTO'
import type { DerivedHostSummaryDTO } from '../../generated/openapi/models/DerivedHostSummaryDTO'
import type { DerivedHttpSummaryDTO } from '../../generated/openapi/models/DerivedHttpSummaryDTO'
import type { DerivedVusSummaryDTO } from '../../generated/openapi/models/DerivedVusSummaryDTO'
import { AsyncStateView } from '../ui/async-state/AsyncState'

const POLL_INTERVAL_MS = 5000

function formatTimestamp(value?: Date): string {
  if (!value) {
    return 'n/a'
  }

  return new Date(value).toLocaleString()
}

function formatRunStatus(status?: string): string {
  if (!status) {
    return 'Unknown'
  }

  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatRuntime(startedAt?: Date, finishedAt?: Date): string | null {
  if (!startedAt || !finishedAt) {
    return null
  }

  const durationMs = finishedAt.getTime() - startedAt.getTime()
  if (durationMs < 0) {
    return null
  }

  const totalSeconds = Math.floor(durationMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

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

function toStatusVariant(
  status?: string,
):
  | 'pending'
  | 'running'
  | 'success'
  | 'stopped'
  | 'failed'
  | 'unknown' {
  switch (status) {
    case BenchmarkRunDTOStatusEnum.PendingStart:
    case BenchmarkRunDTOStatusEnum.PendingStop:
      return 'pending'
    case BenchmarkRunDTOStatusEnum.Started:
      return 'running'
    case BenchmarkRunDTOStatusEnum.Finished:
      return 'success'
    case BenchmarkRunDTOStatusEnum.Stopped:
      return 'stopped'
    case BenchmarkRunDTOStatusEnum.Failed:
      return 'failed'
    default:
      return 'unknown'
  }
}

function isActiveStatus(status?: string): boolean {
  return (
    status === BenchmarkRunDTOStatusEnum.PendingStart ||
    status === BenchmarkRunDTOStatusEnum.Started ||
    status === BenchmarkRunDTOStatusEnum.PendingStop
  )
}

function isStoppableStatus(status?: string): boolean {
  return (
    status === BenchmarkRunDTOStatusEnum.PendingStart ||
    status === BenchmarkRunDTOStatusEnum.Started
  )
}

function getStatusSymbol(variant: ReturnType<typeof toStatusVariant>): string {
  switch (variant) {
    case 'pending':
      return '…'
    case 'running':
      return '●'
    case 'success':
      return '✓'
    case 'stopped':
      return '■'
    case 'failed':
      return '!'
    default:
      return '?'
  }
}

export function BenchmarkRunMonitorPage() {
  const { environmentId = '', benchmarkId = '', runId = '' } = useParams<{
    environmentId: string
    benchmarkId: string
    runId: string
  }>()
  const [environmentName, setEnvironmentName] = useState<string | null>(null)
  const [benchmarkName, setBenchmarkName] = useState<string | null>(null)
  const [runData, setRunData] = useState<BenchmarkRunDTO | null>(null)
  const [httpMetrics, setHttpMetrics] = useState<Array<DerivedHttpSummaryDTO>>([])
  const [hostMetrics, setHostMetrics] = useState<Array<DerivedHostSummaryDTO>>([])
  const [vusMetrics, setVusMetrics] = useState<DerivedVusSummaryDTO | null>(null)
  const [isLoadingNames, setIsLoadingNames] = useState(true)
  const [isRunLoading, setIsRunLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pollError, setPollError] = useState<string | null>(null)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [copyMessage, setCopyMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isStoppingRun, setIsStoppingRun] = useState(false)
  const [stopError, setStopError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const latestRunDetailsRequestRef = useRef(0)
  const runStatus = runData?.status
  const runStatusVariant = toStatusVariant(runStatus)
  const runStatusText = formatRunStatus(runStatus)
  const runStatusWithReason = runData?.statusReason?.trim()
    ? `${runStatusText} (${runData.statusReason.trim()})`
    : runStatusText
  const shouldPoll = isActiveStatus(runStatus)

  const applyRunDetails = useCallback((details: BenchmarkRunDerivedDTO) => {
    setRunData(details.run ?? null)
    setHttpMetrics(details.http ?? [])
    setHostMetrics(details.hosts ?? [])
    setVusMetrics(details.vus ?? null)
  }, [])

  const loadRunDetails = useCallback(
    async (mode: 'initial' | 'poll' = 'initial') => {
      const requestId = ++latestRunDetailsRequestRef.current

      if (!environmentId.trim() || !benchmarkId.trim() || !runId.trim()) {
        if (isMountedRef.current) {
          setLoadError('Environment ID, benchmark ID, or run ID is missing.')
          setIsRunLoading(false)
        }
        return
      }

      if (mode === 'initial' && isMountedRef.current) {
        setIsRunLoading(true)
        setLoadError(null)
        setPollError(null)
      }

      try {
        const runDetails = await getBenchmarkRunDetails(environmentId, benchmarkId, runId)
        if (!isMountedRef.current || requestId !== latestRunDetailsRequestRef.current) {
          return
        }

        applyRunDetails(runDetails)
        if (mode === 'poll') {
          setPollError(null)
        }
      } catch (error: unknown) {
        if (!isMountedRef.current || requestId !== latestRunDetailsRequestRef.current) {
          return
        }

        const message =
          error instanceof BenchmarkRunDetailsError
            ? error.message
            : 'Unable to load benchmark run details right now.'

        if (mode === 'poll') {
          setPollError(message)
        } else {
          setLoadError(message)
        }
      } finally {
        if (
          mode === 'initial' &&
          isMountedRef.current &&
          requestId === latestRunDetailsRequestRef.current
        ) {
          setIsRunLoading(false)
        }
      }
    },
    [applyRunDetails, benchmarkId, environmentId, runId],
  )

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!environmentId.trim() || !benchmarkId.trim() || !runId.trim()) {
      setLoadError('Environment ID, benchmark ID, or run ID is missing.')
      setIsLoadingNames(false)
      return
    }

    let isActive = true
    setIsLoadingNames(true)

    const loadContext = async () => {
      const [environmentResult, benchmarkResult] = await Promise.allSettled([
        getEnvironmentDetails(environmentId),
        getBenchmark(environmentId, benchmarkId),
      ])

      if (!isActive) {
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

      setIsLoadingNames(false)
    }

    void loadContext()
    void loadRunDetails('initial')

    return () => {
      isActive = false
    }
  }, [benchmarkId, environmentId, loadRunDetails, retryAttempt, runId])

  useEffect(() => {
    if (!shouldPoll) {
      return
    }

    let cancelled = false
    let timeoutId: number | undefined

    const pollOnce = async () => {
      if (cancelled) {
        return
      }

      await loadRunDetails('poll')

      if (!cancelled) {
        timeoutId = window.setTimeout(() => {
          void pollOnce()
        }, POLL_INTERVAL_MS)
      }
    }

    void pollOnce()

    return () => {
      cancelled = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [loadRunDetails, shouldPoll])

  useEffect(() => {
    if (!copyMessage) {
      return
    }

    const timer = window.setTimeout(() => {
      setCopyMessage(null)
    }, 2500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [copyMessage])

  const copyId = async (target: 'environment' | 'benchmark') => {
    const value = target === 'environment' ? environmentId : benchmarkId
    if (!value.trim()) {
      setCopyMessage({
        type: 'error',
        text: `Missing ${target} id. Nothing copied.`,
      })
      return
    }

    if (!navigator.clipboard?.writeText) {
      setCopyMessage({
        type: 'error',
        text: 'Clipboard is not available in this browser context.',
      })
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage({
        type: 'success',
        text: `${target === 'environment' ? 'Environment' : 'Benchmark'} id copied.`,
      })
    } catch {
      setCopyMessage({
        type: 'error',
        text: 'Unable to copy id to clipboard.',
      })
    }
  }

  const handleStopRun = async () => {
    if (!environmentId.trim() || !benchmarkId.trim() || !runId.trim()) {
      setStopError('Environment ID, benchmark ID, or run ID is missing.')
      return
    }

    const confirmed = window.confirm(
      'Stop this benchmark run now? This action cannot be undone.',
    )
    if (!confirmed) {
      return
    }

    setIsStoppingRun(true)
    setStopError(null)

    try {
      const stopped = await stopBenchmarkRun(environmentId, benchmarkId, runId)
      setRunData((current) =>
        current
          ? { ...current, status: stopped.status, id: stopped.runId ?? current.id }
          : current,
      )
      await loadRunDetails('initial')
    } catch (error: unknown) {
      if (error instanceof StopBenchmarkRunError) {
        setStopError(error.message)
      } else {
        setStopError('Unable to stop benchmark run right now.')
      }
    } finally {
      setIsStoppingRun(false)
    }
  }

  const handleRefresh = () => {
    void loadRunDetails('initial')
  }

  const isLoading = isLoadingNames || isRunLoading
  const endedWithRuntime = runData?.finishedAt
    ? `${formatTimestamp(runData.finishedAt)}${
        formatRuntime(runData.startedAt, runData.finishedAt)
          ? ` (${formatRuntime(runData.startedAt, runData.finishedAt)})`
          : ''
      }`
    : 'Not finished yet'
  const topHttp = useMemo(
    () => [...httpMetrics].sort((a, b) => (b.totalRequests ?? 0) - (a.totalRequests ?? 0)).slice(0, 5),
    [httpMetrics],
  )

  return (
    <article className="shell-page">
      <div className="run-monitor-top-row">
        <div>
          <h1>Run monitor</h1>
          <p className="auth-text run-monitor-byline">
            This screen auto-refreshes while the run is active.
          </p>
        </div>
        <div className="run-monitor-header-controls">
          <div className="run-monitor-header-actions">
            {isStoppableStatus(runStatus) ? (
              <button
                type="button"
                className="shell-alert-dismiss run-monitor-stop"
                onClick={() => void handleStopRun()}
                disabled={isStoppingRun}
              >
                {isStoppingRun ? 'Stopping...' : 'Stop run'}
              </button>
            ) : null}
            <button
              type="button"
              className="shell-alert-dismiss run-monitor-refresh"
              onClick={handleRefresh}
              disabled={isRunLoading || isStoppingRun}
              aria-label={isRunLoading ? 'Refreshing run details' : 'Refresh run details'}
              title="Refresh run details"
            >
              <svg
                className="run-monitor-refresh-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M21 12a9 9 0 0 0-15.36-6.36" />
                <polyline points="9 4.5 5 5.5 6 1.5" />
                <path d="M3 12a9 9 0 0 0 15.36 6.36" />
                <polyline points="15 19.5 19 18.5 18 22.5" />
              </svg>
            </button>
          </div>
          <section
            className={`run-monitor-status run-monitor-status-${runStatusVariant}`}
            aria-live="polite"
          >
            <p className="run-monitor-status-value">
              <span className="run-monitor-status-symbol" aria-hidden="true">
                {getStatusSymbol(runStatusVariant)}
              </span>
              <span>{runStatusWithReason}</span>
            </p>
          </section>
        </div>
      </div>

      <AsyncStateView
        isLoading={isLoading}
        error={loadError}
        isEmpty={false}
        onRetry={() => setRetryAttempt((current) => current + 1)}
        loadingTitle="Loading run context"
      >
        {pollError ? (
          <p className="auth-notice auth-notice-error benchmark-copy-feedback" role="alert">
            {pollError}
          </p>
        ) : null}

        {stopError ? (
          <p className="auth-notice auth-notice-error benchmark-copy-feedback" role="alert">
            {stopError}
          </p>
        ) : null}

        <section className="run-monitor-details-section">
          <section className="environment-detail-grid run-monitor-details-grid">
            <div>
              <p className="shell-context-label">Environment</p>
              <p className="shell-context-value">
                <button
                  type="button"
                  className="shell-context-copy-button"
                  onClick={() => void copyId('environment')}
                  title={`Copy environment id: ${environmentId}`}
                >
                  {environmentName ?? (environmentId || 'n/a')}
                </button>
              </p>
            </div>
            <div>
              <p className="shell-context-label">Benchmark</p>
              <p className="shell-context-value">
                <button
                  type="button"
                  className="shell-context-copy-button"
                  onClick={() => void copyId('benchmark')}
                  title={`Copy benchmark id: ${benchmarkId}`}
                >
                  {benchmarkName ?? (benchmarkId || 'n/a')}
                </button>
              </p>
            </div>
            <div>
              <p className="shell-context-label">Run</p>
              <p className="shell-context-value">{runId || 'n/a'}</p>
            </div>
            <div>
              <p className="shell-context-label">Queued at</p>
              <p className="shell-context-value">{formatTimestamp(runData?.createdAt)}</p>
            </div>
            <div>
              <p className="shell-context-label">Started at</p>
              <p className="shell-context-value">{formatTimestamp(runData?.startedAt)}</p>
            </div>
            <div>
              <p className="shell-context-label">Ended at</p>
              <p className="shell-context-value">{endedWithRuntime}</p>
            </div>
          </section>
        </section>

        <section className="run-monitor-metrics">
          <h2>Live metrics snapshot</h2>
          <div className="run-monitor-metrics-grid">
            <article className="run-metric-card">
              <h3>VUs</h3>
              <p>Avg: {formatMetric(vusMetrics?.avg)}</p>
              <p>Min: {formatMetric(vusMetrics?.min)}</p>
              <p>Max: {formatMetric(vusMetrics?.max)}</p>
            </article>

            <article className="run-metric-card">
              <h3>HTTP overview</h3>
              {topHttp.length === 0 ? (
                <p>No HTTP metrics available yet.</p>
              ) : (
                <ul className="run-metric-list">
                  {topHttp.map((metric) => (
                    <li key={`${metric.requestGroup ?? ''}|${metric.url ?? ''}`}>
                      <strong>{metric.requestGroup ?? metric.url ?? 'Request group'}</strong>
                      <span>
                        {metric.totalRequests ?? 0} req, {formatRatePercent(metric.errorRate)} err
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="run-metric-card">
              <h3>Host resources</h3>
              {hostMetrics.length === 0 ? (
                <p>No host metrics available yet.</p>
              ) : (
                <ul className="run-metric-list">
                  {hostMetrics.slice(0, 4).map((host) => (
                    <li key={`${host.hostId ?? ''}|${host.hostName ?? ''}`}>
                      <strong>{host.hostName ?? host.hostId ?? 'Host'}</strong>
                      <span>
                        CPU avg {formatMetric(host.resource?.cpu?.avg, '%')} | Mem avg{' '}
                        {formatMetric(host.resource?.memory?.avg, '%')} | Net in{' '}
                        {formatBytes(host.resource?.networkInTotalBytes)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </section>

        {copyMessage ? (
          <p
            className={
              copyMessage.type === 'error'
                ? 'auth-notice auth-notice-error benchmark-copy-feedback'
                : 'auth-notice benchmark-copy-feedback'
            }
            role={copyMessage.type === 'error' ? 'alert' : 'status'}
          >
            {copyMessage.text}
          </p>
        ) : null}
      </AsyncStateView>

      <Link className="shell-alert-dismiss" to={`/environments/${environmentId}`}>
        Back to environment
      </Link>
    </article>
  )
}
