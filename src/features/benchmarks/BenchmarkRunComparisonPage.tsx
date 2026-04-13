import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DerivedHttpSummaryDTO } from '../../generated/openapi/models/DerivedHttpSummaryDTO'
import { getEnvironmentDetails } from '../environments/service'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import type { AxisScaleMode } from './charting'
import {
  applyComparisonSlidingAverage,
  COMPARISON_MS_METRICS,
  COMPARISON_VUS_METRICS,
  type ComparisonMetricKey,
  mergeK6ChartPointsByElapsed,
  resolveComparisonYAxisDomain,
} from './comparisonCharting'
import {
  BenchmarkRunDetailsError,
  getBenchmark,
  getComparisonData,
  type ComparisonRunData,
} from './service'
import {
  formatDelta,
  formatRunStatus,
  formatRuntimeDuration,
  formatTimestamp,
} from './format'

function formatMetric(value?: number, unit = ''): string {
  if (value == null || Number.isNaN(value)) return 'n/a'
  return `${value.toFixed(2)}${unit}`
}

function formatRatePercent(value?: number): string {
  if (value == null || Number.isNaN(value)) return 'n/a'
  return `${(value * 100).toFixed(2)}%`
}

function formatBytes(value?: number): string {
  if (value == null || Number.isNaN(value)) return 'n/a'
  if (value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(size >= 100 ? 0 : size >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

const AXIS_MODE_OPTIONS: Array<{ value: AxisScaleMode; label: string; description: string }> = [
  { value: 'auto', label: 'Auto', description: 'Automatic Y-axis scaling.' },
  { value: 'from-zero', label: 'From-zero', description: 'Y-axis starts at zero.' },
  { value: 'tight', label: 'Tight', description: 'Y-axis fits closely around visible data.' },
]

type ChartRenderMode = 'line' | 'points'

const CHART_RENDER_MODE_OPTIONS: Array<{ value: ChartRenderMode; label: string; description: string }> = [
  { value: 'line', label: 'Line', description: 'Connected line chart.' },
  { value: 'points', label: 'Points', description: 'Points-only chart rendering.' },
]

type ComparisonSeriesVisibility = Record<ComparisonMetricKey, boolean>

const DEFAULT_SERIES_VISIBILITY: ComparisonSeriesVisibility = {
  httpResponseTimeMs_A: true,
  httpWaitingMs_A: true,
  vus_A: true,
  httpResponseTimeMs_B: true,
  httpWaitingMs_B: true,
  vus_B: true,
}

type BrushRange = { startIndex: number; endIndex: number }
type BrushChangeEvent = { startIndex?: number; endIndex?: number }

function toComparisonMetricKey(value: unknown): ComparisonMetricKey | null {
  const valid: ReadonlyArray<ComparisonMetricKey> = [
    ...COMPARISON_MS_METRICS,
    ...COMPARISON_VUS_METRICS,
  ]
  return valid.includes(value as ComparisonMetricKey) ? (value as ComparisonMetricKey) : null
}

function formatComparisonTooltipValue(
  value: number | string | ReadonlyArray<number | string> | null | undefined,
  name: number | string | undefined,
): [string, string] {
  const label = typeof name === 'undefined' ? 'Value' : String(name)
  const normalizedValue = Array.isArray(value) ? value[0] : value
  if (typeof normalizedValue !== 'number' || Number.isNaN(normalizedValue)) {
    return ['n/a', label]
  }
  if (label.includes('VUs')) {
    return [normalizedValue.toFixed(0), label]
  }
  return [`${normalizedValue.toFixed(2)} ms`, label]
}

function collectPercentileKeys(
  httpA: Array<DerivedHttpSummaryDTO>,
  httpB: Array<DerivedHttpSummaryDTO>,
): Array<string> {
  const keys = new Set<string>()
  for (const metric of [...httpA, ...httpB]) {
    if (metric.duration?.percentiles) {
      for (const key of Object.keys(metric.duration.percentiles)) {
        keys.add(key)
      }
    }
    if (metric.waiting?.percentiles) {
      for (const key of Object.keys(metric.waiting.percentiles)) {
        keys.add(key)
      }
    }
  }
  return Array.from(keys).sort()
}

function matchHttpGroups(
  httpA: Array<DerivedHttpSummaryDTO>,
  httpB: Array<DerivedHttpSummaryDTO>,
): Array<{ groupName: string; a: DerivedHttpSummaryDTO | null; b: DerivedHttpSummaryDTO | null }> {
  const map = new Map<string, { a: DerivedHttpSummaryDTO | null; b: DerivedHttpSummaryDTO | null }>()

  for (const metric of httpA) {
    const key = metric.requestGroup ?? metric.url ?? 'default'
    map.set(key, { a: metric, b: null })
  }
  for (const metric of httpB) {
    const key = metric.requestGroup ?? metric.url ?? 'default'
    const existing = map.get(key)
    if (existing) {
      existing.b = metric
    } else {
      map.set(key, { a: null, b: metric })
    }
  }

  return Array.from(map.entries()).map(([groupName, pair]) => ({ groupName, ...pair }))
}

const SERIES_CONFIG: Array<{
  dataKey: ComparisonMetricKey
  name: string
  yAxisId: string
  color: string
  dashPattern?: string
  width: number
}> = [
  { dataKey: 'httpResponseTimeMs_A', name: 'HTTP response (A)', yAxisId: 'ms', color: '#2563eb', width: 2 },
  { dataKey: 'httpResponseTimeMs_B', name: 'HTTP response (B)', yAxisId: 'ms', color: '#dc2626', dashPattern: '10 4', width: 2.5 },
  { dataKey: 'httpWaitingMs_A', name: 'HTTP waiting (A)', yAxisId: 'ms', color: '#60a5fa', width: 2 },
  { dataKey: 'httpWaitingMs_B', name: 'HTTP waiting (B)', yAxisId: 'ms', color: '#f97316', dashPattern: '10 4', width: 2.5 },
  { dataKey: 'vus_A', name: 'VUs (A)', yAxisId: 'vus', color: '#16a34a', width: 2 },
  { dataKey: 'vus_B', name: 'VUs (B)', yAxisId: 'vus', color: '#a855f7', dashPattern: '10 4', width: 2.5 },
]

export function BenchmarkRunComparisonPage() {
  const {
    environmentId = '',
    benchmarkId = '',
    runIdA = '',
    runIdB = '',
  } = useParams<{
    environmentId: string
    benchmarkId: string
    runIdA: string
    runIdB: string
  }>()
  const navigate = useNavigate()

  const [environmentName, setEnvironmentName] = useState<string | null>(null)
  const [benchmarkName, setBenchmarkName] = useState<string | null>(null)
  const [comparisonData, setComparisonData] = useState<ComparisonRunData | null>(null)
  const [fatalError, setFatalError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryAttempt, setRetryAttempt] = useState(0)

  const [axisScaleMode, setAxisScaleMode] = useState<AxisScaleMode>('auto')
  const [chartRenderMode, setChartRenderMode] = useState<ChartRenderMode>('line')
  const [smoothingLevel, setSmoothingLevel] = useState(0)
  const [visibleSeries, setVisibleSeries] = useState<ComparisonSeriesVisibility>(DEFAULT_SERIES_VISIBILITY)
  const [brushRange, setBrushRange] = useState<BrushRange | null>(null)
  const [selectedPercentiles, setSelectedPercentiles] = useState<Set<string> | null>(null)

  const environmentLabel = (environmentName ?? environmentId).trim() || 'n/a'
  const benchmarkLabel = (benchmarkName ?? benchmarkId).trim() || 'n/a'
  const benchmarkPath = `/environments/${environmentId}/benchmarks/${benchmarkId}`

  useEffect(() => {
    if (!environmentId.trim() || !benchmarkId.trim() || !runIdA.trim() || !runIdB.trim()) {
      setFatalError('Missing required route parameters.')
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setFatalError(null)
    setComparisonData(null)

    const load = async () => {
      const [envResult, bmResult, compResult] = await Promise.allSettled([
        getEnvironmentDetails(environmentId, controller.signal),
        getBenchmark(environmentId, benchmarkId, controller.signal),
        getComparisonData(environmentId, benchmarkId, runIdA, runIdB, controller.signal),
      ])

      if (controller.signal.aborted) return

      setEnvironmentName(
        envResult.status === 'fulfilled'
          ? envResult.value.name?.trim() || environmentId
          : environmentId,
      )
      setBenchmarkName(
        bmResult.status === 'fulfilled'
          ? bmResult.value.name?.trim() || benchmarkId
          : benchmarkId,
      )

      if (compResult.status === 'fulfilled') {
        setComparisonData(compResult.value)
      } else {
        const err = compResult.reason
        setFatalError(
          err instanceof BenchmarkRunDetailsError
            ? err.message
            : 'Failed to load comparison data. Please try again.',
        )
      }

      setIsLoading(false)
    }

    void load()
    return () => controller.abort()
  }, [benchmarkId, environmentId, retryAttempt, runIdA, runIdB])

  const runA = comparisonData?.derivedA?.run
  const runB = comparisonData?.derivedB?.run
  const httpA = useMemo(() => [...(comparisonData?.derivedA?.http ?? [])].sort((a, b) => (b.totalRequests ?? 0) - (a.totalRequests ?? 0)), [comparisonData])
  const httpB = useMemo(() => [...(comparisonData?.derivedB?.http ?? [])].sort((a, b) => (b.totalRequests ?? 0) - (a.totalRequests ?? 0)), [comparisonData])
  const vusA = comparisonData?.derivedA?.vus
  const vusB = comparisonData?.derivedB?.vus
  const hostsA = useMemo(() => [...(comparisonData?.derivedA?.hosts ?? [])].sort((a, b) => (a.hostName ?? '').localeCompare(b.hostName ?? '')), [comparisonData])
  const hostsB = useMemo(() => [...(comparisonData?.derivedB?.hosts ?? [])].sort((a, b) => (a.hostName ?? '').localeCompare(b.hostName ?? '')), [comparisonData])

  const matchedHttpGroups = useMemo(() => matchHttpGroups(httpA, httpB), [httpA, httpB])
  const percentileKeys = useMemo(() => collectPercentileKeys(httpA, httpB), [httpA, httpB])

  // Default to all percentiles selected once data loads
  const activePercentiles = useMemo(
    () => selectedPercentiles ?? new Set(percentileKeys),
    [selectedPercentiles, percentileKeys],
  )
  const visiblePercentileKeys = useMemo(
    () => percentileKeys.filter((k) => activePercentiles.has(k)),
    [percentileKeys, activePercentiles],
  )

  function togglePercentile(key: string) {
    const next = new Set(activePercentiles)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setSelectedPercentiles(next)
  }

  function toggleAllPercentiles() {
    if (activePercentiles.size === percentileKeys.length) {
      setSelectedPercentiles(new Set())
    } else {
      setSelectedPercentiles(new Set(percentileKeys))
    }
  }

  const baseChartPoints = useMemo(
    () => mergeK6ChartPointsByElapsed(comparisonData?.rawA ?? null, comparisonData?.rawB ?? null),
    [comparisonData],
  )
  const smoothingWindowSize = smoothingLevel === 0 ? 1 : smoothingLevel + 1
  const chartPoints = useMemo(
    () => applyComparisonSlidingAverage(baseChartPoints, smoothingWindowSize),
    [baseChartPoints, smoothingWindowSize],
  )

  const maxBrushIndex = Math.max(chartPoints.length - 1, 0)
  const brushStartIndex = Math.min(Math.max(brushRange?.startIndex ?? 0, 0), maxBrushIndex)
  const brushEndIndex = Math.min(Math.max(brushRange?.endIndex ?? maxBrushIndex, brushStartIndex), maxBrushIndex)
  const visibleChartPoints = useMemo(() => {
    if (chartPoints.length === 0) return []
    return chartPoints.slice(brushStartIndex, brushEndIndex + 1)
  }, [brushEndIndex, brushStartIndex, chartPoints])

  const msAxisDomain = useMemo(
    () => resolveComparisonYAxisDomain(visibleChartPoints, COMPARISON_MS_METRICS, axisScaleMode),
    [axisScaleMode, visibleChartPoints],
  )
  const vusAxisDomain = useMemo(
    () => resolveComparisonYAxisDomain(visibleChartPoints, COMPARISON_VUS_METRICS, axisScaleMode),
    [axisScaleMode, visibleChartPoints],
  )

  useEffect(() => {
    if (chartPoints.length === 0) {
      setBrushRange(null)
      return
    }
    setBrushRange({ startIndex: 0, endIndex: chartPoints.length - 1 })
  }, [baseChartPoints, chartPoints.length, runIdA, runIdB])

  const showPointsOnly = chartRenderMode === 'points'
  const isZoomed = chartPoints.length > 1 && (brushStartIndex > 0 || brushEndIndex < chartPoints.length - 1)

  const handleBrushChange = (nextRange: BrushChangeEvent) => {
    if (chartPoints.length === 0) return
    if (typeof nextRange.startIndex !== 'number' || typeof nextRange.endIndex !== 'number') return
    const maxIndex = chartPoints.length - 1
    const startIndex = Math.min(Math.max(nextRange.startIndex, 0), maxIndex)
    const endIndex = Math.min(Math.max(nextRange.endIndex, startIndex), maxIndex)
    setBrushRange({ startIndex, endIndex })
  }

  const handleResetZoom = () => {
    if (chartPoints.length === 0) { setBrushRange(null); return }
    setBrushRange({ startIndex: 0, endIndex: chartPoints.length - 1 })
  }

  const handleLegendClick = (entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !('dataKey' in entry)) return
    const dataKey = toComparisonMetricKey((entry as { dataKey?: unknown }).dataKey)
    if (!dataKey) return
    setVisibleSeries((current) => ({ ...current, [dataKey]: !current[dataKey] }))
  }

  const runIdAShort = runIdA.slice(0, 8)
  const runIdBShort = runIdB.slice(0, 8)

  return (
    <article className="shell-page">
      <div className="run-results-top-row">
        <div>
          <h1>Run comparison</h1>
          <p className="auth-text run-results-byline">
            Comparing <strong>Run A</strong> ({runIdAShort}) vs <strong>Run B</strong> ({runIdBShort})
          </p>
        </div>
        <button type="button" className="shell-alert-dismiss" onClick={() => navigate(benchmarkPath)}>
          Back to benchmark
        </button>
      </div>

      <AsyncStateView
        isLoading={isLoading}
        error={fatalError}
        isEmpty={false}
        onRetry={() => setRetryAttempt((c) => c + 1)}
        loadingTitle="Loading comparison data"
      >
        {/* Breadcrumb */}
        <nav className="run-comparison-breadcrumb">
          <Link to="/environments">Environments</Link>
          {' / '}
          <Link to={`/environments/${environmentId}`}>{environmentLabel}</Link>
          {' / '}
          <Link to={benchmarkPath}>{benchmarkLabel}</Link>
          {' / '}
          <span>Compare</span>
        </nav>

        {/* Metadata header */}
        <section className="run-comparison-metadata">
          <div className="run-comparison-run-card run-comparison-run-a">
            <h3>Run A <span className="run-comparison-run-id">({runIdAShort})</span></h3>
            <div className="run-comparison-meta-grid">
              <div>
                <p className="shell-context-label">Status</p>
                <p className="shell-context-value">{formatRunStatus(runA?.status)}</p>
              </div>
              <div>
                <p className="shell-context-label">Started</p>
                <p className="shell-context-value">{formatTimestamp(runA?.startedAt)}</p>
              </div>
              <div>
                <p className="shell-context-label">Ended</p>
                <p className="shell-context-value">{formatTimestamp(runA?.finishedAt)}</p>
              </div>
              <div>
                <p className="shell-context-label">Duration</p>
                <p className="shell-context-value">{formatRuntimeDuration(runA?.startedAt, runA?.finishedAt) ?? 'n/a'}</p>
              </div>
              <div>
                <p className="shell-context-label">Started by</p>
                <p className="shell-context-value">{runA?.startedBy?.trim() || 'n/a'}</p>
              </div>
            </div>
          </div>
          <div className="run-comparison-run-card run-comparison-run-b">
            <h3>Run B <span className="run-comparison-run-id">({runIdBShort})</span></h3>
            <div className="run-comparison-meta-grid">
              <div>
                <p className="shell-context-label">Status</p>
                <p className="shell-context-value">{formatRunStatus(runB?.status)}</p>
              </div>
              <div>
                <p className="shell-context-label">Started</p>
                <p className="shell-context-value">{formatTimestamp(runB?.startedAt)}</p>
              </div>
              <div>
                <p className="shell-context-label">Ended</p>
                <p className="shell-context-value">{formatTimestamp(runB?.finishedAt)}</p>
              </div>
              <div>
                <p className="shell-context-label">Duration</p>
                <p className="shell-context-value">{formatRuntimeDuration(runB?.startedAt, runB?.finishedAt) ?? 'n/a'}</p>
              </div>
              <div>
                <p className="shell-context-label">Started by</p>
                <p className="shell-context-value">{runB?.startedBy?.trim() || 'n/a'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* VUs comparison */}
        <section className="run-results-section">
          <h2>Virtual users</h2>
          <div className="run-comparison-vus-grid">
            <table className="run-comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="run-comparison-col-a">Run A</th>
                  <th className="run-comparison-col-b">Run B</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Avg</td>
                  <td className="run-comparison-col-a">{formatMetric(vusA?.avg)}</td>
                  <td className="run-comparison-col-b">{formatMetric(vusB?.avg)}</td>
                  <td className={deltaClass(vusA?.avg, vusB?.avg)}>{formatDelta(vusA?.avg, vusB?.avg)}</td>
                </tr>
                <tr>
                  <td>Min</td>
                  <td className="run-comparison-col-a">{formatMetric(vusA?.min)}</td>
                  <td className="run-comparison-col-b">{formatMetric(vusB?.min)}</td>
                  <td className={deltaClass(vusA?.min, vusB?.min)}>{formatDelta(vusA?.min, vusB?.min)}</td>
                </tr>
                <tr>
                  <td>Max</td>
                  <td className="run-comparison-col-a">{formatMetric(vusA?.max)}</td>
                  <td className="run-comparison-col-b">{formatMetric(vusB?.max)}</td>
                  <td className={deltaClass(vusA?.max, vusB?.max)}>{formatDelta(vusA?.max, vusB?.max)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Overlay charts */}
        <section className="run-results-section">
          <h2>Chart comparison</h2>
          {chartPoints.length === 0 ? (
            <p className="run-results-placeholder">
              Time-series data is not available for one or both runs.
            </p>
          ) : (
            <div className="run-results-chart-shell">
              <div className="run-results-chart-controls">
                <div className="run-results-axis-mode-group" role="group" aria-label="Y-axis scale">
                  {AXIS_MODE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`shell-alert-dismiss run-results-axis-mode-button${axisScaleMode === option.value ? ' is-selected' : ''}`}
                      onClick={() => setAxisScaleMode(option.value)}
                      aria-pressed={axisScaleMode === option.value}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="run-results-axis-mode-group" role="group" aria-label="Chart render mode">
                  {CHART_RENDER_MODE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`shell-alert-dismiss run-results-axis-mode-button${chartRenderMode === option.value ? ' is-selected' : ''}`}
                      onClick={() => setChartRenderMode(option.value)}
                      aria-pressed={chartRenderMode === option.value}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="run-results-smoothing-slider-group">
                  <label className="run-results-smoothing-slider-label" htmlFor="comparison-smoothing-slider">
                    Sliding average: {smoothingLevel === 0 ? 'Raw' : smoothingLevel}
                  </label>
                  <input
                    id="comparison-smoothing-slider"
                    className="run-results-smoothing-slider-input"
                    type="range"
                    min={0}
                    max={9}
                    step={1}
                    value={smoothingLevel}
                    onChange={(e) => {
                      const next = Number(e.currentTarget.value)
                      if (!Number.isNaN(next)) setSmoothingLevel(Math.min(Math.max(next, 0), 9))
                    }}
                    aria-label="Sliding average level from 0 to 9"
                  />
                  <div className="run-results-smoothing-slider-marks" aria-hidden="true">
                    <span>Raw</span>
                    <span>5</span>
                    <span>9</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="shell-alert-dismiss run-results-chart-reset"
                  onClick={handleResetZoom}
                  disabled={!isZoomed}
                >
                  Reset zoom
                </button>
              </div>

              <div className="run-results-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartPoints} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke="#d9e2ef" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="elapsedMs"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      minTickGap={42}
                      tickFormatter={(v: number) => {
                        const s = Math.floor(v / 1000)
                        const m = Math.floor(s / 60)
                        return m > 0 ? `${m}m ${(s % 60).toString().padStart(2, '0')}s` : `${s}s`
                      }}
                      label={{ value: 'Elapsed time', position: 'insideBottomRight', offset: -4 }}
                    />
                    <YAxis
                      yAxisId="ms"
                      domain={msAxisDomain}
                      tickFormatter={(v: number) => `${Math.round(v)} ms`}
                      width={68}
                    />
                    <YAxis
                      yAxisId="vus"
                      orientation="right"
                      domain={vusAxisDomain}
                      tickFormatter={(v: number) => `${Math.round(v)}`}
                      width={46}
                    />
                    <Tooltip
                      formatter={formatComparisonTooltipValue}
                      labelFormatter={(label: unknown) => {
                        if (typeof label !== 'number') return String(label)
                        const s = Math.floor(label / 1000)
                        const m = Math.floor(s / 60)
                        return m > 0 ? `Elapsed: ${m}m ${(s % 60).toString().padStart(2, '0')}s` : `Elapsed: ${s}s`
                      }}
                      isAnimationActive={false}
                    />
                    <Legend onClick={handleLegendClick} />
                    {SERIES_CONFIG.map((series) => (
                      <Line
                        key={series.dataKey}
                        yAxisId={series.yAxisId}
                        type="linear"
                        dataKey={series.dataKey}
                        name={series.name}
                        hide={!visibleSeries[series.dataKey]}
                        stroke={series.color}
                        strokeWidth={showPointsOnly ? 0.0001 : series.width}
                        strokeDasharray={series.dashPattern}
                        dot={
                          showPointsOnly
                            ? { r: 3.5, fill: series.color, stroke: series.color, strokeWidth: 1 }
                            : false
                        }
                        activeDot={{ r: 5, fill: series.color, stroke: series.color }}
                        connectNulls
                      />
                    ))}
                    {chartPoints.length > 1 ? (
                      <Brush
                        dataKey="elapsedMs"
                        startIndex={brushStartIndex}
                        endIndex={brushEndIndex}
                        onChange={handleBrushChange}
                        tickFormatter={(v: number) => {
                          const s = Math.floor(v / 1000)
                          return s >= 60 ? `${Math.floor(s / 60)}m` : `${s}s`
                        }}
                        height={30}
                        stroke="#64748b"
                      />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>

        {/* HTTP statistics comparison */}
        <section className="run-results-section">
          <h2>HTTP comparison</h2>
          {percentileKeys.length > 0 && (
            <div className="run-comparison-percentile-selector">
              <span className="run-comparison-percentile-label">Percentiles:</span>
              <button
                type="button"
                className={`run-comparison-percentile-pill ${activePercentiles.size === percentileKeys.length ? 'active' : ''}`}
                onClick={toggleAllPercentiles}
              >
                All
              </button>
              {percentileKeys.map((pKey) => (
                <button
                  key={pKey}
                  type="button"
                  className={`run-comparison-percentile-pill ${activePercentiles.has(pKey) ? 'active' : ''}`}
                  onClick={() => togglePercentile(pKey)}
                >
                  {pKey}
                </button>
              ))}
            </div>
          )}
          {matchedHttpGroups.length === 0 ? (
            <p className="run-results-placeholder">
              No HTTP metrics available for comparison.
            </p>
          ) : (
            matchedHttpGroups.map(({ groupName, a, b }) => (
              <div key={groupName} className="run-comparison-http-group">
                <h3>{groupName}</h3>
                <div className="run-results-table-wrap">
                  <table className="run-comparison-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th className="run-comparison-col-a">Run A</th>
                        <th className="run-comparison-col-b">Run B</th>
                        <th>Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Total requests</td>
                        <td className="run-comparison-col-a">{a?.totalRequests ?? 'n/a'}</td>
                        <td className="run-comparison-col-b">{b?.totalRequests ?? 'n/a'}</td>
                        <td className={deltaClass(a?.totalRequests, b?.totalRequests)}>{formatDelta(a?.totalRequests, b?.totalRequests)}</td>
                      </tr>
                      <tr>
                        <td>Requests/s</td>
                        <td className="run-comparison-col-a">{formatMetric(a?.requestsPerSecond)}</td>
                        <td className="run-comparison-col-b">{formatMetric(b?.requestsPerSecond)}</td>
                        <td className={deltaClass(a?.requestsPerSecond, b?.requestsPerSecond)}>{formatDelta(a?.requestsPerSecond, b?.requestsPerSecond)}</td>
                      </tr>
                      <tr>
                        <td>Error rate</td>
                        <td className="run-comparison-col-a">{formatRatePercent(a?.errorRate)}</td>
                        <td className="run-comparison-col-b">{formatRatePercent(b?.errorRate)}</td>
                        <td className={deltaClass(a?.errorRate, b?.errorRate)}>{formatDelta(a?.errorRate, b?.errorRate)}</td>
                      </tr>
                      <tr>
                        <td>Data received</td>
                        <td className="run-comparison-col-a">{formatBytes(a?.totalDataReceivedBytes)}</td>
                        <td className="run-comparison-col-b">{formatBytes(b?.totalDataReceivedBytes)}</td>
                        <td className={deltaClass(a?.totalDataReceivedBytes, b?.totalDataReceivedBytes)}>{formatDelta(a?.totalDataReceivedBytes, b?.totalDataReceivedBytes, 'B')}</td>
                      </tr>
                      <tr>
                        <td>Data sent</td>
                        <td className="run-comparison-col-a">{formatBytes(a?.totalDataSentBytes)}</td>
                        <td className="run-comparison-col-b">{formatBytes(b?.totalDataSentBytes)}</td>
                        <td className={deltaClass(a?.totalDataSentBytes, b?.totalDataSentBytes)}>{formatDelta(a?.totalDataSentBytes, b?.totalDataSentBytes, 'B')}</td>
                      </tr>
                      <tr>
                        <td>Avg duration</td>
                        <td className="run-comparison-col-a">{formatMetric(a?.duration?.avg, ' ms')}</td>
                        <td className="run-comparison-col-b">{formatMetric(b?.duration?.avg, ' ms')}</td>
                        <td className={deltaClass(a?.duration?.avg, b?.duration?.avg)}>{formatDelta(a?.duration?.avg, b?.duration?.avg, 'ms')}</td>
                      </tr>
                      <tr>
                        <td>Min duration</td>
                        <td className="run-comparison-col-a">{formatMetric(a?.duration?.min, ' ms')}</td>
                        <td className="run-comparison-col-b">{formatMetric(b?.duration?.min, ' ms')}</td>
                        <td className={deltaClass(a?.duration?.min, b?.duration?.min)}>{formatDelta(a?.duration?.min, b?.duration?.min, 'ms')}</td>
                      </tr>
                      <tr>
                        <td>Max duration</td>
                        <td className="run-comparison-col-a">{formatMetric(a?.duration?.max, ' ms')}</td>
                        <td className="run-comparison-col-b">{formatMetric(b?.duration?.max, ' ms')}</td>
                        <td className={deltaClass(a?.duration?.max, b?.duration?.max)}>{formatDelta(a?.duration?.max, b?.duration?.max, 'ms')}</td>
                      </tr>
                      <tr>
                        <td>Median duration</td>
                        <td className="run-comparison-col-a">{formatMetric(a?.duration?.median, ' ms')}</td>
                        <td className="run-comparison-col-b">{formatMetric(b?.duration?.median, ' ms')}</td>
                        <td className={deltaClass(a?.duration?.median, b?.duration?.median)}>{formatDelta(a?.duration?.median, b?.duration?.median, 'ms')}</td>
                      </tr>
                      {visiblePercentileKeys.map((pKey) => (
                        <tr key={pKey}>
                          <td>{pKey} duration</td>
                          <td className="run-comparison-col-a">{formatMetric(a?.duration?.percentiles?.[pKey], ' ms')}</td>
                          <td className="run-comparison-col-b">{formatMetric(b?.duration?.percentiles?.[pKey], ' ms')}</td>
                          <td className={deltaClass(a?.duration?.percentiles?.[pKey], b?.duration?.percentiles?.[pKey])}>
                            {formatDelta(a?.duration?.percentiles?.[pKey], b?.duration?.percentiles?.[pKey], 'ms')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Host resources comparison */}
        <section className="run-results-section">
          <h2>Host resources</h2>
          {hostsA.length === 0 && hostsB.length === 0 ? (
            <p className="run-results-placeholder">
              No host resource data available for comparison.
            </p>
          ) : (
            <div className="run-comparison-hosts">
              <div className="run-comparison-host-panel">
                <h3>Run A hosts</h3>
                {hostsA.length === 0 ? (
                  <p>No host data available.</p>
                ) : (
                  <ul className="run-results-host-list">
                    {hostsA.map((host) => (
                      <li key={`a-${host.hostId ?? host.hostName ?? ''}`}>
                        <h4>{host.hostName ?? host.hostId ?? 'Host'}</h4>
                        <p>CPU avg {formatMetric(host.resource?.cpu?.avg, '%')} | Mem avg {formatMetric(host.resource?.memory?.avg, '%')}</p>
                        <p>Net in {formatBytes(host.resource?.networkInTotalBytes)} | Net out {formatBytes(host.resource?.networkOutTotalBytes)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="run-comparison-host-panel">
                <h3>Run B hosts</h3>
                {hostsB.length === 0 ? (
                  <p>No host data available.</p>
                ) : (
                  <ul className="run-results-host-list">
                    {hostsB.map((host) => (
                      <li key={`b-${host.hostId ?? host.hostName ?? ''}`}>
                        <h4>{host.hostName ?? host.hostId ?? 'Host'}</h4>
                        <p>CPU avg {formatMetric(host.resource?.cpu?.avg, '%')} | Mem avg {formatMetric(host.resource?.memory?.avg, '%')}</p>
                        <p>Net in {formatBytes(host.resource?.networkInTotalBytes)} | Net out {formatBytes(host.resource?.networkOutTotalBytes)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </AsyncStateView>
    </article>
  )
}

function deltaClass(a: number | undefined | null, b: number | undefined | null): string {
  if (a == null || b == null || Number.isNaN(a) || Number.isNaN(b)) return ''
  const diff = b - a
  if (diff > 0) return 'run-comparison-delta-regression'
  if (diff < 0) return 'run-comparison-delta-improvement'
  return ''
}
