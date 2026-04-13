import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getEnvironmentDetails } from '../environments/service'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import {
  BenchmarkRunsLoadError,
  DeleteBenchmarkRunError,
  deleteBenchmarkRun,
  getBenchmark,
  GetBenchmarkError,
  listActiveEnvironmentRuns,
  listBenchmarkRuns,
  startBenchmark,
  StartBenchmarkError,
  stopBenchmarkRun,
  StopBenchmarkRunError,
} from './service'
import {
  BenchmarkRunDTOStatusEnum,
  type BenchmarkRunDTO,
} from '../../generated/openapi/models/BenchmarkRunDTO'
import {
  formatRunStatus,
  formatRuntimeDuration,
  formatTimestamp,
} from './format'

type JsTokenKind = 'plain' | 'keyword' | 'string' | 'number' | 'comment'

type JsToken = {
  kind: JsTokenKind
  value: string
}

const JS_TOKEN_REGEX =
  /(\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:await|break|case|catch|class|const|continue|default|do|else|export|extends|finally|for|function|if|import|let|new|return|switch|throw|try|var|while|async|from|of|in|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g

function tokenizeJavaScript(source: string): Array<JsToken> {
  const tokens: Array<JsToken> = []
  let cursor = 0

  for (const match of source.matchAll(JS_TOKEN_REGEX)) {
    const index = match.index ?? 0
    const value = match[0]

    if (index > cursor) {
      tokens.push({ kind: 'plain', value: source.slice(cursor, index) })
    }

    let kind: JsTokenKind = 'keyword'
    if (value.startsWith('//') || value.startsWith('/*')) {
      kind = 'comment'
    } else if (
      value.startsWith('"') ||
      value.startsWith("'") ||
      value.startsWith('`')
    ) {
      kind = 'string'
    } else if (/^\d/.test(value)) {
      kind = 'number'
    }

    tokens.push({ kind, value })
    cursor = index + value.length
  }

  if (cursor < source.length) {
    tokens.push({ kind: 'plain', value: source.slice(cursor) })
  }

  return tokens
}

function isActiveRunStatus(status?: string): boolean {
  return (
    status === BenchmarkRunDTOStatusEnum.PendingStart ||
    status === BenchmarkRunDTOStatusEnum.Started ||
    status === BenchmarkRunDTOStatusEnum.PendingStop
  )
}

function isCancellableRunStatus(status?: string): boolean {
  return (
    status === BenchmarkRunDTOStatusEnum.PendingStart ||
    status === BenchmarkRunDTOStatusEnum.Started
  )
}

function toStatusVariant(
  status?: string,
): 'pending' | 'running' | 'stopped' | 'success' | 'failed' | 'unknown' {
  switch (status) {
    case BenchmarkRunDTOStatusEnum.PendingStart:
    case BenchmarkRunDTOStatusEnum.PendingStop:
      return 'pending'
    case BenchmarkRunDTOStatusEnum.Started:
      return 'running'
    case BenchmarkRunDTOStatusEnum.Stopped:
      return 'stopped'
    case BenchmarkRunDTOStatusEnum.Finished:
      return 'success'
    case BenchmarkRunDTOStatusEnum.Failed:
      return 'failed'
    default:
      return 'unknown'
  }
}

function formatEndedWithRuntime(run: BenchmarkRunDTO): string {
  if (!run.finishedAt) {
    return 'Not finished yet'
  }

  const startedAt = run.startedAt ?? run.createdAt
  const endedAtLabel = formatTimestamp(run.finishedAt)
  const runtime = formatRuntimeDuration(startedAt, run.finishedAt)

  return runtime ? `${endedAtLabel} (${runtime})` : endedAtLabel
}

function isResultsSummaryStatus(status?: BenchmarkRunDTO['status']): boolean {
  return status === BenchmarkRunDTOStatusEnum.Finished
}

function getRunDetailsPath(
  environmentId: string,
  benchmarkId: string,
  runId: string,
  status?: BenchmarkRunDTO['status'],
): string {
  const runMonitorPath = `/environments/${environmentId}/benchmarks/${benchmarkId}/runs/${runId}`
  if (isResultsSummaryStatus(status)) {
    return `${runMonitorPath}/results`
  }

  return runMonitorPath
}

function getRunDetailsLabel(status?: BenchmarkRunDTO['status']): string {
  return isResultsSummaryStatus(status) ? 'View results summary' : 'Run monitor'
}

export function BenchmarkDetailsPage() {
  const { environmentId = '', benchmarkId = '' } = useParams<{
    environmentId: string
    benchmarkId: string
  }>()
  const location = useLocation()
  const navigate = useNavigate()

  const [environmentName, setEnvironmentName] = useState<string | null>(null)
  const [benchmarkName, setBenchmarkName] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [runs, setRuns] = useState<Array<BenchmarkRunDTO>>([])
  const [activeRunsCount, setActiveRunsCount] = useState(0)
  const [activeRunsError, setActiveRunsError] = useState<string | null>(null)
  const [runsError, setRunsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [isStartingRun, setIsStartingRun] = useState(false)
  const [runActionInFlightById, setRunActionInFlightById] = useState<
    Record<string, boolean>
  >({})
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [selectedRunIds, setSelectedRunIds] = useState<Array<string>>([])
  const [instructionsExpanded, setInstructionsExpanded] = useState(false)
  const codeBlockRef = useRef<HTMLPreElement>(null)
  const [instructionsOverflow, setInstructionsOverflow] = useState(false)
  // Clear run selections when navigating to a different benchmark
  useEffect(() => {
    setSelectedRunIds([])
  }, [environmentId, benchmarkId])

  // Detect whether the instructions code block overflows its max-height
  useEffect(() => {
    const el = codeBlockRef.current
    if (el) {
      setInstructionsOverflow(el.scrollHeight > el.clientHeight)
    }
  }, [instructions])

  const toggleRunSelection = (runId: string) => {
    setSelectedRunIds((current) => {
      if (current.includes(runId)) {
        return current.filter((id) => id !== runId)
      }
      if (current.length >= 2) {
        return current
      }
      return [...current, runId]
    })
  }

  const canCompare = selectedRunIds.length === 2

  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!environmentId.trim() || !benchmarkId.trim()) {
        setError('Environment ID or benchmark ID is missing.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      setRunsError(null)
      setActiveRunsError(null)

      const [environmentResult, benchmarkResult, runsResult, activeRunsResult] =
        await Promise.allSettled([
          getEnvironmentDetails(environmentId, signal),
          getBenchmark(environmentId, benchmarkId, signal),
          listBenchmarkRuns(environmentId, benchmarkId, signal),
          listActiveEnvironmentRuns(environmentId, signal),
        ])

      if (signal.aborted) {
        return
      }

      if (environmentResult.status === 'fulfilled') {
        setEnvironmentName(environmentResult.value.name?.trim() || environmentId)
      } else {
        setEnvironmentName(environmentId)
      }

      if (benchmarkResult.status === 'rejected') {
        if (benchmarkResult.reason instanceof GetBenchmarkError) {
          setError(benchmarkResult.reason.message)
        } else {
          setError('Unable to load benchmark details right now.')
        }
        setIsLoading(false)
        return
      }

      const benchmark = benchmarkResult.value
      setBenchmarkName(benchmark.name?.trim() || benchmarkId)
      setDescription(benchmark.description?.trim() || '')
      setInstructions(benchmark.k6Instructions?.trim() || '')

      if (runsResult.status === 'fulfilled') {
        setRuns(runsResult.value)
      } else if (runsResult.reason instanceof BenchmarkRunsLoadError) {
        setRunsError(runsResult.reason.message)
        setRuns([])
      } else {
        setRunsError('Unable to load benchmark runs right now.')
        setRuns([])
      }

      if (activeRunsResult.status === 'fulfilled') {
        setActiveRunsCount(activeRunsResult.value.length)
      } else if (activeRunsResult.reason instanceof BenchmarkRunsLoadError) {
        setActiveRunsError(activeRunsResult.reason.message)
        setActiveRunsCount(0)
      } else {
        setActiveRunsError('Unable to verify active runs right now.')
        setActiveRunsCount(0)
      }

      setIsLoading(false)
    },
    [benchmarkId, environmentId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)

    return () => controller.abort()
  }, [load, retryAttempt])

  const sortedRuns = useMemo(
    () =>
      [...runs].sort((left, right) => {
        const leftDate = new Date(
          left.startedAt ?? left.createdAt ?? '1970-01-01T00:00:00.000Z',
        ).getTime()
        const rightDate = new Date(
          right.startedAt ?? right.createdAt ?? '1970-01-01T00:00:00.000Z',
        ).getTime()
        return rightDate - leftDate
      }),
    [runs],
  )

  const isStartBlockedByActiveRun = activeRunsCount > 0
  const isStartBlocked = isStartingRun || isStartBlockedByActiveRun || Boolean(activeRunsError)
  const startBlockedReason = activeRunsError
    ? 'Unable to verify active runs in this environment right now.'
    : isStartBlockedByActiveRun
      ? 'A run is already active in this environment.'
      : undefined
  const hasBenchmarkActiveRun = runs.some((run) => isActiveRunStatus(run.status))
  const hasRunsLoadError = Boolean(runsError)
  const isEditBlocked =
    hasBenchmarkActiveRun || isLoading || hasRunsLoadError || !benchmarkId.trim()
  const editBlockedReason = hasBenchmarkActiveRun
    ? 'You cannot edit this benchmark while it has an active run.'
    : isLoading
      ? 'Benchmark runs are still loading. Please wait before editing this benchmark.'
      : hasRunsLoadError
        ? 'Unable to verify benchmark run status right now, so editing is temporarily disabled.'
        : undefined

  const instructionSource =
    instructions || '// No benchmark instructions were provided.'
  const instructionTokens = useMemo(
    () => tokenizeJavaScript(instructionSource),
    [instructionSource],
  )

  const setRunActionBusy = (runId: string, isBusy: boolean) => {
    setRunActionInFlightById((current) => ({ ...current, [runId]: isBusy }))
  }

  const handleStartRun = async () => {
    if (!environmentId.trim() || !benchmarkId.trim()) {
      setActionError('Environment ID or benchmark ID is missing.')
      return
    }
    if (isStartBlocked) {
      return
    }

    setActionError(null)
    setActionNotice(null)
    setIsStartingRun(true)

    try {
      const started = await startBenchmark(environmentId, benchmarkId)
      const runId = started.runId?.trim()
      if (!runId) {
        setActionError(
          'Benchmark started, but run id was missing. Please refresh and try again.',
        )
        return
      }

      navigate(
        `/environments/${environmentId}/benchmarks/${benchmarkId}/runs/${runId}`,
      )
    } catch (nextError: unknown) {
      if (nextError instanceof StartBenchmarkError) {
        setActionError(nextError.message)
      } else {
        setActionError('Unable to start benchmark right now.')
      }
    } finally {
      setIsStartingRun(false)
    }
  }

  const handleCancelRun = async (run: BenchmarkRunDTO) => {
    const runId = run.id?.trim()
    if (!runId) {
      setActionError('Run id is missing and cannot be cancelled.')
      return
    }

    if (!isCancellableRunStatus(run.status)) {
      setActionError('This run is already stopping and cannot be cancelled again.')
      return
    }

    const confirmed = window.confirm('Cancel this active run?')
    if (!confirmed) {
      return
    }

    setActionError(null)
    setActionNotice(null)
    setRunActionBusy(runId, true)

    try {
      await stopBenchmarkRun(environmentId, benchmarkId, runId)
      setActionNotice('Run cancellation was requested.')
      setRetryAttempt((current) => current + 1)
    } catch (nextError: unknown) {
      if (nextError instanceof StopBenchmarkRunError) {
        setActionError(nextError.message)
      } else {
        setActionError('Unable to cancel benchmark run right now.')
      }
    } finally {
      setRunActionBusy(runId, false)
    }
  }

  const handleDeleteRun = async (run: BenchmarkRunDTO) => {
    const runId = run.id?.trim()
    if (!runId) {
      setActionError('Run id is missing and cannot be deleted.')
      return
    }

    const confirmed = window.confirm(
      'Delete this run data permanently? This action cannot be undone.',
    )
    if (!confirmed) {
      return
    }

    setActionError(null)
    setActionNotice(null)
    setRunActionBusy(runId, true)

    try {
      await deleteBenchmarkRun(environmentId, benchmarkId, runId)
      setActionNotice('Run data was deleted.')
      setRetryAttempt((current) => current + 1)
    } catch (nextError: unknown) {
      if (nextError instanceof DeleteBenchmarkRunError) {
        setActionError(nextError.message)
      } else {
        setActionError('Unable to delete benchmark run right now.')
      }
    } finally {
      setRunActionBusy(runId, false)
    }
  }

  return (
    <article className="shell-page">
      <div className="benchmark-details-header">
        <div className="benchmark-details-header-text-grid">
          <h1 className="benchmark-details-main-heading">
            {benchmarkName ?? 'Benchmark details'}
          </h1>
          <div className="benchmark-details-instructions-topline">
            <h2 className="benchmark-details-instructions-heading">
              Benchmark instructions
            </h2>
            <div className="benchmark-details-header-actions">
              <button
                type="button"
                className="shell-alert-dismiss benchmark-details-edit-action"
                onClick={() =>
                  navigate(`/environments/${environmentId}/benchmarks/${benchmarkId}/edit`)
                }
                disabled={isEditBlocked}
                aria-describedby={
                  isEditBlocked && editBlockedReason
                    ? 'benchmark-edit-blocked-reason'
                    : undefined
                }
              >
                Edit
              </button>
              <button
                type="button"
                className="auth-button benchmark-details-start-action"
                onClick={() => void handleStartRun()}
                disabled={isStartBlocked}
                aria-describedby={
                  isStartBlocked && startBlockedReason
                    ? 'benchmark-start-blocked-reason'
                    : undefined
                }
              >
                {isStartingRun ? 'Starting...' : 'Start run'}
              </button>
              <Link className="shell-alert-dismiss" to={`/environments/${environmentId}`}>
                Back to environment
              </Link>
            </div>
          </div>
          <p className="auth-text benchmark-details-byline">
            Inspect benchmark instructions and manage benchmark run lifecycle.
          </p>
          <p className="auth-text benchmark-details-instructions-byline">
            These instructions are used when starting a new run for this benchmark.
          </p>
          {isEditBlocked && editBlockedReason ? (
            <p
              id="benchmark-edit-blocked-reason"
              className="auth-text benchmark-details-blocked-reason"
              role="status"
            >
              Edit unavailable: {editBlockedReason}
            </p>
          ) : null}
          {isStartBlocked && startBlockedReason ? (
            <p
              id="benchmark-start-blocked-reason"
              className="auth-text benchmark-details-blocked-reason"
              role="status"
            >
              Start run unavailable: {startBlockedReason}
            </p>
          ) : null}
        </div>
      </div>

      <AsyncStateView
        isLoading={isLoading}
        error={error}
        isEmpty={false}
        onRetry={() => setRetryAttempt((current) => current + 1)}
        loadingTitle="Loading benchmark details"
      >
        {actionError ? (
          <p className="auth-notice auth-notice-error benchmark-action-error" role="alert">
            {actionError}
          </p>
        ) : null}
        {actionNotice ? (
          <p className="auth-notice benchmark-action-success" role="status">
            {actionNotice}
          </p>
        ) : null}
        {activeRunsError ? (
          <p className="auth-notice auth-notice-error benchmark-action-error" role="alert">
            {activeRunsError}
          </p>
        ) : null}

        <section className="benchmark-details-split-layout">
          <div className="benchmark-details-main-column">
            <section className="benchmark-details-context-section">
              <section className="environment-detail-grid benchmark-details-context-grid">
                <div>
                  <p className="shell-context-label">Environment</p>
                  <p className="shell-context-value">{environmentName ?? environmentId}</p>
                </div>
                <div>
                  <p className="shell-context-label">Benchmark id</p>
                  <p className="shell-context-value">{benchmarkId || 'n/a'}</p>
                </div>
                <div>
                  <p className="shell-context-label">Description</p>
                  <p className="shell-context-value">
                    {description || 'No description provided.'}
                  </p>
                </div>
                <div>
                  <p className="shell-context-label">Active runs in environment</p>
                  <p className="shell-context-value">
                    {activeRunsError ? 'Unknown' : String(activeRunsCount)}
                  </p>
                </div>
              </section>
            </section>
          </div>

          <section className="benchmark-details-section benchmark-details-instructions-section">
            <div className="benchmark-details-instructions-shell">
              <pre
                ref={codeBlockRef}
                className={`benchmark-details-code-block${instructionsExpanded ? ' expanded' : ''}`}
              >
                <code>
                  {instructionTokens.map((token, index) => (
                    <span
                      key={`${token.kind}-${index}`}
                      className={`benchmark-js-token benchmark-js-token-${token.kind}`}
                    >
                      {token.value}
                    </span>
                  ))}
                </code>
              </pre>
              {(instructionsOverflow || instructionsExpanded) && (
                <button
                  type="button"
                  className="benchmark-details-instructions-toggle"
                  onClick={() => setInstructionsExpanded((v) => !v)}
                >
                  {instructionsExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </section>
        </section>

        <section className="benchmark-details-section benchmark-details-runs-section">
          <h2>Runs</h2>
          {runsError ? (
            <p className="auth-notice auth-notice-error benchmark-action-error" role="alert">
              {runsError}
            </p>
          ) : sortedRuns.length === 0 ? (
            <section className="async-state async-state-empty benchmark-details-runs-empty">
              <h2>No runs yet</h2>
              <p>Start this benchmark to create the first run.</p>
            </section>
          ) : (
            <div className="benchmark-details-runs-table-wrap">
              <table className="benchmark-details-runs-table">
                <thead>
                  <tr>
                    <th className="benchmark-details-compare-col">
                      {canCompare ? (
                        <button
                          type="button"
                          className="benchmark-compare-header-button"
                          onClick={() =>
                            navigate(
                              `/environments/${environmentId}/benchmarks/${benchmarkId}/compare/${selectedRunIds[0]}/${selectedRunIds[1]}`,
                            )
                          }
                        >
                          Compare
                        </button>
                      ) : (
                        'Compare'
                      )}
                    </th>
                    <th>Run start</th>
                    <th>Run end / total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRuns.map((run, index) => {
                    const runId = run.id?.trim() ?? ''
                    const isRunActionBusy = Boolean(
                      runId ? runActionInFlightById[runId] : false,
                    )
                    const isActive = isActiveRunStatus(run.status)
                    const isCancelable = isCancellableRunStatus(run.status)
                    const cancelBlockedReason =
                      isActive && !isCancelable
                        ? 'This run is already stopping and cannot be cancelled again.'
                        : undefined
                    const cancelBlockedReasonId = cancelBlockedReason
                      ? `benchmark-run-cancel-blocked-${runId ?? index}`
                      : undefined
                    const startedAt = run.startedAt ?? run.createdAt
                    const runDetailsLabel = getRunDetailsLabel(run.status)
                    const isFinished = isResultsSummaryStatus(run.status)
                    const isSelected = Boolean(runId && selectedRunIds.includes(runId))

                    return (
                      <tr key={runId || `benchmark-run-${index}`}>
                        <td
                          className="benchmark-details-compare-col"
                          title={
                            !isFinished
                              ? 'Only finished runs can be compared'
                              : canCompare && !isSelected
                                ? 'Only two runs can be compared at a time — deselect one first'
                                : undefined
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!runId || !isFinished || (canCompare && !isSelected)}
                            onChange={() => { if (runId) toggleRunSelection(runId) }}
                          />
                        </td>
                        <td>{formatTimestamp(startedAt)}</td>
                        <td>{formatEndedWithRuntime(run)}</td>
                        <td>
                          <span
                            className={`benchmark-status-badge benchmark-status-${toStatusVariant(
                              run.status,
                            )}`}
                          >
                            {formatRunStatus(run.status)}
                          </span>
                        </td>
                        <td>
                          <div className="benchmark-details-run-actions">
                            <button
                              type="button"
                              className="shell-alert-dismiss benchmark-run-action"
                              onClick={() =>
                                navigate(
                                  getRunDetailsPath(
                                    environmentId,
                                    benchmarkId,
                                    runId,
                                    run.status,
                                  ),
                                  { state: { from: location.pathname } },
                                )
                              }
                              disabled={!runId}
                            >
                              {runDetailsLabel}
                            </button>

                            {isActive ? (
                              <>
                                <button
                                  type="button"
                                  className="auth-button benchmark-run-cancel-action"
                                  onClick={() => void handleCancelRun(run)}
                                  disabled={!runId || isRunActionBusy || !isCancelable}
                                  aria-describedby={cancelBlockedReasonId}
                                >
                                  {isRunActionBusy ? 'Cancelling...' : 'Cancel run'}
                                </button>
                                {cancelBlockedReasonId ? (
                                  <p
                                    id={cancelBlockedReasonId}
                                    className="auth-text benchmark-run-action-reason"
                                  >
                                    {cancelBlockedReason}
                                  </p>
                                ) : null}
                              </>
                            ) : (
                              <button
                                type="button"
                                className="shell-alert-dismiss benchmark-run-delete-action"
                                onClick={() => void handleDeleteRun(run)}
                                disabled={!runId || isRunActionBusy}
                              >
                                {isRunActionBusy ? 'Deleting...' : 'Delete run data'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </AsyncStateView>
    </article>
  )
}

