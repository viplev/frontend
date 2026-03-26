import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEnvironmentDetails } from '../environments/service'
import {
  getBenchmark,
  getBenchmarkRunDetails,
  BenchmarkRunDetailsError,
} from './service'
import { AsyncStateView } from '../ui/async-state/AsyncState'

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
    case 'PENDING_START':
    case 'PENDING_STOP':
      return 'pending'
    case 'STARTED':
      return 'running'
    case 'FINISHED':
      return 'success'
    case 'STOPPED':
      return 'stopped'
    case 'FAILED':
      return 'failed'
    default:
      return 'unknown'
  }
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
  const [runStartedAt, setRunStartedAt] = useState<Date | undefined>()
  const [runFinishedAt, setRunFinishedAt] = useState<Date | undefined>()
  const [runStatus, setRunStatus] = useState<string | undefined>()
  const [runStatusReason, setRunStatusReason] = useState<string | undefined>()
  const [runCreatedAt, setRunCreatedAt] = useState<Date | undefined>()
  const [isLoadingNames, setIsLoadingNames] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [copyMessage, setCopyMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const runStatusVariant = toStatusVariant(runStatus)
  const runStatusText = formatRunStatus(runStatus)
  const runStatusWithReason = runStatusReason?.trim()
    ? `${runStatusText} (${runStatusReason.trim()})`
    : runStatusText

  useEffect(() => {
    if (!environmentId.trim() || !benchmarkId.trim()) {
      setLoadError('Environment ID or benchmark ID is missing.')
      setIsLoadingNames(false)
      return
    }

    let isActive = true
    setIsLoadingNames(true)
    setLoadError(null)

    const loadNames = async () => {
      const [environmentResult, benchmarkResult, runResult] = await Promise.allSettled([
        getEnvironmentDetails(environmentId),
        getBenchmark(environmentId, benchmarkId),
        getBenchmarkRunDetails(environmentId, benchmarkId, runId),
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

      if (runResult.status === 'fulfilled') {
        setRunStartedAt(runResult.value.run?.startedAt)
        setRunFinishedAt(runResult.value.run?.finishedAt)
        setRunStatus(runResult.value.run?.status)
        setRunStatusReason(runResult.value.run?.statusReason)
        setRunCreatedAt(runResult.value.run?.createdAt)
      } else {
        setRunStartedAt(undefined)
        setRunFinishedAt(undefined)
        setRunStatus(undefined)
        setRunStatusReason(undefined)
        setRunCreatedAt(undefined)
      }

      if (
        environmentResult.status === 'rejected' &&
        benchmarkResult.status === 'rejected' &&
        runResult.status === 'rejected'
      ) {
        const reason = runResult.reason
        if (reason instanceof BenchmarkRunDetailsError) {
          setLoadError(reason.message)
        } else {
          setLoadError('Unable to load run context details right now.')
        }
      }

      setIsLoadingNames(false)
    }

    void loadNames()

    return () => {
      isActive = false
    }
  }, [benchmarkId, environmentId, retryAttempt, runId])

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

  return (
    <article className="shell-page">
      <div className="run-monitor-top-row">
        <div>
          <h1>Run monitor</h1>
          <p className="auth-text run-monitor-byline">
            Live monitoring will be implemented in issue #12. You are now in the correct run
            context.
          </p>
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

      <AsyncStateView
        isLoading={isLoadingNames}
        error={loadError}
        isEmpty={false}
        onRetry={() => setRetryAttempt((current) => current + 1)}
        loadingTitle="Loading run context"
      >
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
              <p className="shell-context-value">{formatTimestamp(runCreatedAt)}</p>
            </div>
            <div>
              <p className="shell-context-label">Started at</p>
              <p className="shell-context-value">{formatTimestamp(runStartedAt)}</p>
            </div>
            <div>
              <p className="shell-context-label">Ended at</p>
              <p className="shell-context-value">
                {runFinishedAt
                  ? `${formatTimestamp(runFinishedAt)}${
                      formatRuntime(runStartedAt, runFinishedAt)
                        ? ` (${formatRuntime(runStartedAt, runFinishedAt)})`
                        : ''
                    }`
                  : 'Not finished yet'}
              </p>
            </div>
          </section>
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
