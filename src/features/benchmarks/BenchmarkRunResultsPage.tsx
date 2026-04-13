import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
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
import type { BenchmarkRunDerivedDTO } from '../../generated/openapi/models/BenchmarkRunDerivedDTO'
import type { BenchmarkRunRawDTO } from '../../generated/openapi/models/BenchmarkRunRawDTO'
import { formatReadableTimestamp } from '../dateTime'
import { getEnvironmentDetails } from '../environments/service'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import {
  applyK6SlidingAverage,
  K6_MS_METRICS,
  K6_VUS_METRICS,
  type AxisScaleMode,
  type K6MetricKey,
  normalizeK6ChartPoints,
  resolveYAxisDomain,
} from './charting'
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

const AXIS_MODE_OPTIONS: Array<{
  value: AxisScaleMode
  label: string
  description: string
}> = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Automatic Y-axis scaling.',
  },
  {
    value: 'from-zero',
    label: 'From-zero',
    description: 'Y-axis starts at zero.',
  },
  {
    value: 'tight',
    label: 'Tight',
    description: 'Y-axis fits closely around visible data.',
  },
]

type ChartRenderMode = 'line' | 'points'

const CHART_RENDER_MODE_OPTIONS: Array<{
  value: ChartRenderMode
  label: string
  description: string
}> = [
  {
    value: 'line',
    label: 'Line',
    description: 'Connected line chart.',
  },
  {
    value: 'points',
    label: 'Points',
    description: 'Points-only chart rendering.',
  },
]

type SeriesVisibility = Record<K6MetricKey, boolean>

const DEFAULT_SERIES_VISIBILITY: SeriesVisibility = {
  httpResponseTimeMs: true,
  httpWaitingMs: true,
  vus: true,
}

type BrushRange = {
  startIndex: number
  endIndex: number
}

type BrushChangeEvent = {
  startIndex?: number
  endIndex?: number
}

function toTimestampValue(value: number | string): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsedNumber = Number(value)
    if (Number.isFinite(parsedNumber)) {
      return parsedNumber
    }

    const parsedDate = new Date(value)
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.getTime()
    }
  }

  return null
}

function formatChartTickLabel(value: number | string): string {
  const timestampMs = toTimestampValue(value)
  if (timestampMs == null) {
    return ''
  }

  const formatted = formatReadableTimestamp(new Date(timestampMs))
  if (!formatted) {
    return ''
  }

  return formatted.split(', ')[1] ?? formatted
}

function formatChartTooltipLabel(label: unknown): string {
  if (typeof label !== 'number' && typeof label !== 'string') {
    return 'n/a'
  }

  const timestampMs = toTimestampValue(label)
  if (timestampMs == null) {
    return String(label)
  }

  return formatReadableTimestamp(new Date(timestampMs)) ?? String(label)
}

function formatChartTooltipValue(
  value: number | string | ReadonlyArray<number | string> | null | undefined,
  name: number | string | undefined,
): [string, string] {
  const label = typeof name === 'undefined' ? 'Value' : String(name)
  const normalizedValue = Array.isArray(value) ? value[0] : value

  if (typeof normalizedValue !== 'number' || Number.isNaN(normalizedValue)) {
    return ['n/a', label]
  }

  if (label === 'Virtual users') {
    return [normalizedValue.toFixed(0), label]
  }

  return [`${normalizedValue.toFixed(2)} ms`, label]
}

function toK6MetricKey(value: unknown): K6MetricKey | null {
  if (value === 'httpResponseTimeMs') {
    return 'httpResponseTimeMs'
  }
  if (value === 'httpWaitingMs') {
    return 'httpWaitingMs'
  }
  if (value === 'vus') {
    return 'vus'
  }
  return null
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
  const [axisScaleMode, setAxisScaleMode] = useState<AxisScaleMode>('auto')
  const [chartRenderMode, setChartRenderMode] = useState<ChartRenderMode>('line')
  const [smoothingLevel, setSmoothingLevel] = useState(0)
  const [visibleSeries, setVisibleSeries] = useState<SeriesVisibility>(DEFAULT_SERIES_VISIBILITY)
  const [brushRange, setBrushRange] = useState<BrushRange | null>(null)

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
  const baseK6ChartPoints = useMemo(() => normalizeK6ChartPoints(rawData), [rawData])
  const smoothingWindowSize = smoothingLevel === 0 ? 1 : smoothingLevel + 1
  const k6ChartPoints = useMemo(
    () => applyK6SlidingAverage(baseK6ChartPoints, smoothingWindowSize),
    [baseK6ChartPoints, smoothingWindowSize],
  )
  const msAxisDomain = useMemo(
    () => resolveYAxisDomain(k6ChartPoints, K6_MS_METRICS, axisScaleMode),
    [axisScaleMode, k6ChartPoints],
  )
  const vusAxisDomain = useMemo(
    () => resolveYAxisDomain(k6ChartPoints, K6_VUS_METRICS, axisScaleMode),
    [axisScaleMode, k6ChartPoints],
  )

  useEffect(() => {
    if (k6ChartPoints.length === 0) {
      setBrushRange(null)
      return
    }

    setBrushRange({
      startIndex: 0,
      endIndex: k6ChartPoints.length - 1,
    })
  }, [k6ChartPoints.length])

  const brushStartIndex = brushRange?.startIndex ?? 0
  const brushEndIndex = brushRange?.endIndex ?? Math.max(k6ChartPoints.length - 1, 0)
  const showPointsOnly = chartRenderMode === 'points'
  const isZoomed =
    k6ChartPoints.length > 1 &&
    (brushStartIndex > 0 || brushEndIndex < k6ChartPoints.length - 1)

  const handleBrushChange = (nextRange: BrushChangeEvent) => {
    if (k6ChartPoints.length === 0) {
      return
    }

    if (
      typeof nextRange.startIndex !== 'number' ||
      typeof nextRange.endIndex !== 'number'
    ) {
      return
    }

    const maxIndex = k6ChartPoints.length - 1
    const startIndex = Math.min(Math.max(nextRange.startIndex, 0), maxIndex)
    const endIndex = Math.min(Math.max(nextRange.endIndex, startIndex), maxIndex)

    setBrushRange({ startIndex, endIndex })
  }

  const handleResetZoom = () => {
    if (k6ChartPoints.length === 0) {
      setBrushRange(null)
      return
    }

    setBrushRange({
      startIndex: 0,
      endIndex: k6ChartPoints.length - 1,
    })
  }

  const handleLegendClick = (entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !('dataKey' in entry)) {
      return
    }

    const dataKey = toK6MetricKey((entry as { dataKey?: unknown }).dataKey)
    if (!dataKey) {
      return
    }

    setVisibleSeries((current) => ({
      ...current,
      [dataKey]: !current[dataKey],
    }))
  }

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
          <h2>Interactive chart analysis</h2>
          {k6ChartPoints.length === 0 ? (
            <p className="run-results-placeholder">
              K6 time-series data is not available for this run.
            </p>
          ) : (
            <div className="run-results-chart-shell">
              <div className="run-results-chart-controls">
                <div className="run-results-axis-mode-group" role="group" aria-label="Y-axis scale">
                  {AXIS_MODE_OPTIONS.map((option) => {
                    const isSelected = axisScaleMode === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`shell-alert-dismiss run-results-axis-mode-button${
                          isSelected ? ' is-selected' : ''
                        }`}
                        onClick={() => setAxisScaleMode(option.value)}
                        aria-pressed={isSelected}
                        title={option.description}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                <div className="run-results-axis-mode-group" role="group" aria-label="Chart render mode">
                  {CHART_RENDER_MODE_OPTIONS.map((option) => {
                    const isSelected = chartRenderMode === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`shell-alert-dismiss run-results-axis-mode-button${
                          isSelected ? ' is-selected' : ''
                        }`}
                        onClick={() => setChartRenderMode(option.value)}
                        aria-pressed={isSelected}
                        title={option.description}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                <div className="run-results-smoothing-slider-group">
                  <label
                    className="run-results-smoothing-slider-label"
                    htmlFor="run-results-smoothing-slider"
                  >
                    Sliding average: {smoothingLevel === 0 ? 'Raw' : smoothingLevel}
                  </label>
                  <input
                    id="run-results-smoothing-slider"
                    className="run-results-smoothing-slider-input"
                    type="range"
                    min={0}
                    max={9}
                    step={1}
                    value={smoothingLevel}
                    onChange={(event) => {
                      const nextLevel = Number(event.currentTarget.value)
                      if (Number.isNaN(nextLevel)) {
                        return
                      }
                      setSmoothingLevel(Math.min(Math.max(nextLevel, 0), 9))
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
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart
                    data={k6ChartPoints}
                    margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid stroke="#d9e2ef" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestampMs"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      minTickGap={42}
                      tickFormatter={formatChartTickLabel}
                    />
                    <YAxis
                      yAxisId="ms"
                      domain={msAxisDomain}
                      tickFormatter={(value: number) => `${Math.round(value)} ms`}
                      width={68}
                    />
                    <YAxis
                      yAxisId="vus"
                      orientation="right"
                      domain={vusAxisDomain}
                      tickFormatter={(value: number) => `${Math.round(value)}`}
                      width={46}
                    />
                    <Tooltip
                      formatter={formatChartTooltipValue}
                      labelFormatter={formatChartTooltipLabel}
                      isAnimationActive={false}
                    />
                    <Legend onClick={handleLegendClick} />
                    <Line
                      yAxisId="ms"
                      type="linear"
                      dataKey="httpResponseTimeMs"
                      name="HTTP response time"
                      hide={!visibleSeries.httpResponseTimeMs}
                      stroke="#2563eb"
                      strokeWidth={showPointsOnly ? 0.0001 : 2}
                      dot={
                        showPointsOnly
                          ? { r: 3.5, fill: '#2563eb', stroke: '#2563eb', strokeWidth: 1 }
                          : false
                      }
                      activeDot={{ r: 5, fill: '#2563eb', stroke: '#2563eb' }}
                      connectNulls
                    />
                    <Line
                      yAxisId="ms"
                      type="linear"
                      dataKey="httpWaitingMs"
                      name="HTTP waiting time"
                      hide={!visibleSeries.httpWaitingMs}
                      stroke="#f97316"
                      strokeWidth={showPointsOnly ? 0.0001 : 2}
                      dot={
                        showPointsOnly
                          ? { r: 3.5, fill: '#f97316', stroke: '#f97316', strokeWidth: 1 }
                          : false
                      }
                      activeDot={{ r: 5, fill: '#f97316', stroke: '#f97316' }}
                      connectNulls
                    />
                    <Line
                      yAxisId="vus"
                      type="linear"
                      dataKey="vus"
                      name="Virtual users"
                      hide={!visibleSeries.vus}
                      stroke="#16a34a"
                      strokeWidth={showPointsOnly ? 0.0001 : 2}
                      dot={
                        showPointsOnly
                          ? { r: 3.5, fill: '#16a34a', stroke: '#16a34a', strokeWidth: 1 }
                          : false
                      }
                      activeDot={{ r: 5, fill: '#16a34a', stroke: '#16a34a' }}
                      connectNulls
                    />
                    {k6ChartPoints.length > 1 ? (
                      <Brush
                        dataKey="timestampMs"
                        startIndex={brushStartIndex}
                        endIndex={brushEndIndex}
                        onChange={handleBrushChange}
                        tickFormatter={formatChartTickLabel}
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
