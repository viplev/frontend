import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { BenchmarkDTO } from '../../generated/openapi/models/BenchmarkDTO'
import type { EnvironmentRunSummaryDTO } from '../../generated/openapi/models/EnvironmentRunSummaryDTO'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import {
  BenchmarksLoadError,
  listActiveEnvironmentRuns,
  listBenchmarks,
} from './service'

const REFRESH_INTERVAL_MS = 15000

function BenchmarkCard({
  benchmark,
  activeRun,
}: {
  benchmark: BenchmarkDTO
  activeRun: EnvironmentRunSummaryDTO | null
}) {
  const navigate = useNavigate()
  const isRunning = activeRun != null

  return (
    <article className={`benchmark-card ${isRunning ? 'benchmark-card-active' : ''}`}>
      <header className="benchmark-card-header">
        <h2>{benchmark.name}</h2>
        {isRunning ? <span className="benchmark-status-active">Active run</span> : null}
      </header>
      <p>{benchmark.description?.trim() || 'No description provided.'}</p>
      <div className="benchmark-card-actions">
        <button
          type="button"
          className="auth-button"
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
        {isRunning ? (
          <button type="button" className="shell-alert-dismiss" disabled>
            Active run in progress
          </button>
        ) : null}
      </div>
    </article>
  )
}

export function BenchmarksPage() {
  const { environmentId = '' } = useParams<{ environmentId: string }>()
  const navigate = useNavigate()
  const [benchmarks, setBenchmarks] = useState<Array<BenchmarkDTO>>([])
  const [activeRunsByBenchmarkId, setActiveRunsByBenchmarkId] = useState<
    Record<string, EnvironmentRunSummaryDTO>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (signal: AbortSignal, isInitialLoad = true) => {
      if (!environmentId.trim()) {
        setError('Environment ID is missing or invalid.')
        setIsLoading(false)
        return
      }

      if (isInitialLoad) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const [benchmarksResult, runsResult] = await Promise.allSettled([
          listBenchmarks(environmentId),
          listActiveEnvironmentRuns(environmentId),
        ])

        if (signal.aborted) {
          return
        }

        if (benchmarksResult.status === 'rejected') {
          const nextError = benchmarksResult.reason
          if (nextError instanceof BenchmarksLoadError) {
            setError(nextError.message)
          } else {
            setError('Unable to load benchmarks right now.')
          }
          return
        }

        setBenchmarks(benchmarksResult.value)

        if (runsResult.status === 'fulfilled') {
          const nextActiveRuns: Record<string, EnvironmentRunSummaryDTO> = {}
          for (const run of runsResult.value) {
            if (run.benchmarkId && !nextActiveRuns[run.benchmarkId]) {
              nextActiveRuns[run.benchmarkId] = run
            }
          }
          setActiveRunsByBenchmarkId(nextActiveRuns)
        } else {
          // Keep UI non-blocking: active-run highlighting is best-effort.
          setActiveRunsByBenchmarkId({})
        }
      } catch {
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
      void load(controller.signal, false)
    }, REFRESH_INTERVAL_MS)

    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [load])

  const sortedBenchmarks = useMemo(
    () => [...benchmarks].sort((a, b) => a.name.localeCompare(b.name)),
    [benchmarks],
  )

  return (
    <article className="shell-page">
      <div className="environment-page-header">
        <div>
          <h1>Benchmarks</h1>
          <p className="auth-text">
            Benchmarks for this environment refresh automatically every 15 seconds.
          </p>
        </div>
        <div className="benchmark-header-actions">
          <button
            type="button"
            className="auth-button"
            onClick={() => navigate('/benchmarks')}
            disabled={!environmentId}
          >
            Create benchmark
          </button>
          <Link className="shell-alert-dismiss" to={`/environments/${environmentId}`}>
            Back to environment
          </Link>
        </div>
      </div>

      <AsyncStateView
        isLoading={isLoading}
        error={error}
        isEmpty={!isLoading && !error && sortedBenchmarks.length === 0}
        onRetry={() => {
          const controller = new AbortController()
          void load(controller.signal, true)
        }}
        loadingTitle="Loading benchmarks"
        emptyTitle="No benchmarks yet"
        emptyDescription="Create a benchmark to start running scenarios in this environment."
      >
        <section className="benchmark-list">
          {sortedBenchmarks.map((benchmark) => (
            <BenchmarkCard
              key={benchmark.id ?? benchmark.name}
              benchmark={benchmark}
              activeRun={benchmark.id ? activeRunsByBenchmarkId[benchmark.id] ?? null : null}
            />
          ))}
        </section>
      </AsyncStateView>
    </article>
  )
}
