import { useCallback, useEffect, useMemo, useState } from 'react'
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
  type AxisDomain,
  type AxisScaleMode,
  type K6MetricKey,
  normalizeK6ChartPoints,
  resolveYAxisDomain,
} from './charting'
import {
  applyMultiSeriesSlidingAverage,
  applyResourceSlidingAverage,
  getMultiSeriesDataKeys,
  aggregateServiceReplicaDataPoints,
  mergeResourceSeries,
  normalizeResourceDataPoints,
  resolveMultiSeriesYAxisDomain,
  resolveResourceYAxisDomain,
  type ResourceMetricKey,
} from './resourceCharting'
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

const RESOURCE_SERIES_COLORS = [
  '#2563eb',
  '#f97316',
  '#16a34a',
  '#dc2626',
  '#8b5cf6',
  '#06b6d4',
  '#d97706',
  '#ec4899',
]

interface ResourceLineConfig {
  dataKey: string
  name: string
  color: string
  strokeDasharray?: string
}

function makeResourceTooltipFormatter(isByteMetric: boolean) {
  return (
    value: number | string | ReadonlyArray<number | string> | null | undefined,
    name: number | string | undefined,
  ): [string, string] => {
    const label = typeof name === 'undefined' ? 'Value' : String(name)
    const normalizedValue = Array.isArray(value) ? value[0] : value
    if (typeof normalizedValue !== 'number' || Number.isNaN(normalizedValue)) {
      return ['n/a', label]
    }
    return isByteMetric
      ? [formatBytes(normalizedValue), label]
      : [`${normalizedValue.toFixed(1)}%`, label]
  }
}

const cpuTooltipFormatter = makeResourceTooltipFormatter(false)
const byteTooltipFormatter = makeResourceTooltipFormatter(true)

function ResourceChart({
  title,
  data,
  lines,
  yAxisDomain,
  yAxisFormatter,
  tooltipFormatter,
  showPointsOnly,
}: {
  title: string
  data: object[]
  lines: ResourceLineConfig[]
  yAxisDomain: AxisDomain
  yAxisFormatter: (value: number) => string
  tooltipFormatter: (
    value: number | string | ReadonlyArray<number | string> | null | undefined,
    name: number | string | undefined,
  ) => [string, string]
  showPointsOnly: boolean
}){
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set())

  const handleLegendClick = useCallback((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !('dataKey' in entry)) return
    const dataKey = (entry as { dataKey?: string }).dataKey
    if (typeof dataKey !== 'string') return
    setHiddenLines((current) => {
      const next = new Set(current)
      if (next.has(dataKey)) {
        next.delete(dataKey)
      } else {
        next.add(dataKey)
      }
      return next
    })
  }, [])

  if (data.length === 0) {
    return (
      <div className="run-results-resource-chart-wrap">
        <h4 className="run-results-resource-chart-title">{title}</h4>
        <p className="run-results-placeholder">No data</p>
      </div>
    )
  }

  return (
    <div className="run-results-resource-chart-wrap">
      <h4 className="run-results-resource-chart-title">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
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
            domain={yAxisDomain}
            tickFormatter={yAxisFormatter}
            width={68}
          />
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={formatChartTooltipLabel}
            isAnimationActive={false}
          />
          <Legend onClick={handleLegendClick} />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="linear"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeDasharray={line.strokeDasharray}
              strokeWidth={showPointsOnly ? 0.0001 : 2}
              dot={
                showPointsOnly
                  ? { r: 3, fill: line.color, stroke: line.color, strokeWidth: 1 }
                  : false
              }
              activeDot={{ r: 4, fill: line.color, stroke: line.color }}
              connectNulls
              hide={hiddenLines.has(line.dataKey)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
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
  const [resourceAxisScaleMode, setResourceAxisScaleMode] = useState<AxisScaleMode>('auto')
  const [resourceChartRenderMode, setResourceChartRenderMode] = useState<ChartRenderMode>('line')
  const [resourceSmoothingLevel, setResourceSmoothingLevel] = useState(0)
  const [selectedServiceKeysByHost, setSelectedServiceKeysByHost] = useState<
    Record<string, Set<string>>
  >({})

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
        (serviceSum, service) => serviceSum + (service.replicas ?? []).reduce((s, r) => s + (r.dataPoints?.length ?? 0), 0),
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
  const maxBrushIndex = Math.max(k6ChartPoints.length - 1, 0)
  const brushStartIndex = Math.min(Math.max(brushRange?.startIndex ?? 0, 0), maxBrushIndex)
  const brushEndIndex = Math.min(
    Math.max(brushRange?.endIndex ?? maxBrushIndex, brushStartIndex),
    maxBrushIndex,
  )
  const visibleK6ChartPoints = useMemo(() => {
    if (k6ChartPoints.length === 0) {
      return []
    }

    return k6ChartPoints.slice(brushStartIndex, brushEndIndex + 1)
  }, [brushEndIndex, brushStartIndex, k6ChartPoints])
  const msAxisDomain = useMemo(
    () => resolveYAxisDomain(visibleK6ChartPoints, K6_MS_METRICS, axisScaleMode),
    [axisScaleMode, visibleK6ChartPoints],
  )
  const vusAxisDomain = useMemo(
    () => resolveYAxisDomain(visibleK6ChartPoints, K6_VUS_METRICS, axisScaleMode),
    [axisScaleMode, visibleK6ChartPoints],
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
  }, [baseK6ChartPoints, k6ChartPoints.length, runId])

  const showPointsOnly = chartRenderMode === 'points'
  const isZoomed =
    k6ChartPoints.length > 1 &&
    (brushStartIndex > 0 || brushEndIndex < k6ChartPoints.length - 1)

  const brushTimeRange = useMemo<[number, number] | null>(() => {
    if (k6ChartPoints.length === 0) return null
    const startMs = k6ChartPoints[brushStartIndex]?.timestampMs
    const endMs = k6ChartPoints[brushEndIndex]?.timestampMs
    if (startMs == null || endMs == null) return null
    return [startMs, endMs]
  }, [brushStartIndex, brushEndIndex, k6ChartPoints])

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

  useEffect(() => {
    const hosts = rawData?.timeSeries?.hosts
    if (!hosts) {
      setSelectedServiceKeysByHost({})
      return
    }
    const initial: Record<string, Set<string>> = {}
    for (let i = 0; i < hosts.length; i++) {
      const host = hosts[i]
      const hostKey = host.hostId ?? host.hostName ?? `host-${i}`
      initial[hostKey] = new Set(
        (host.services ?? []).map((s, j) => s.serviceId ?? s.serviceName ?? `service-${j}`),
      )
    }
    setSelectedServiceKeysByHost(initial)
  }, [rawData])

  const resourceSmoothingWindowSize =
    resourceSmoothingLevel === 0 ? 1 : resourceSmoothingLevel + 1

  const processedHosts = useMemo(() => {
    const hosts = rawData?.timeSeries?.hosts ?? []
    return hosts.map((host, hostIndex) => {
      const hostKey = host.hostId ?? host.hostName ?? `host-${hostIndex}`
      const hostLabel = host.hostName ?? host.hostId ?? 'Host'

      const rawMachinePoints = normalizeResourceDataPoints(host.dataPoints ?? [])
      const machinePoints = applyResourceSlidingAverage(
        rawMachinePoints,
        resourceSmoothingWindowSize,
      )
      const hasMemoryLimit = machinePoints.some(
        (p) => p.memoryLimitBytes != null && p.memoryLimitBytes > 0,
      )

      const visibleMachinePoints = brushTimeRange
        ? machinePoints.filter(
            (p) => p.timestampMs >= brushTimeRange[0] && p.timestampMs <= brushTimeRange[1],
          )
        : machinePoints

      const machineCpuDomain = resolveResourceYAxisDomain(
        visibleMachinePoints, ['cpuPercentage'], resourceAxisScaleMode,
      )
      const machineMemoryMetrics: ResourceMetricKey[] = hasMemoryLimit
        ? ['memoryUsageBytes', 'memoryLimitBytes']
        : ['memoryUsageBytes']
      const machineMemoryDomain = resolveResourceYAxisDomain(
        visibleMachinePoints, machineMemoryMetrics, resourceAxisScaleMode,
      )
      const machineNetworkDomain = resolveResourceYAxisDomain(
        visibleMachinePoints, ['networkInBytes', 'networkOutBytes'], resourceAxisScaleMode,
      )
      const machineBlockDomain = resolveResourceYAxisDomain(
        visibleMachinePoints, ['blockInBytes', 'blockOutBytes'], resourceAxisScaleMode,
      )

      const machineMemoryLines: ResourceLineConfig[] = [
        { dataKey: 'memoryUsageBytes', name: 'Usage', color: '#8b5cf6' },
      ]
      if (hasMemoryLimit) {
        machineMemoryLines.push({
          dataKey: 'memoryLimitBytes',
          name: 'Limit',
          color: '#94a3b8',
          strokeDasharray: '5 3',
        })
      }

      const allServices = (host.services ?? []).map((s, serviceIndex) => ({
        key: s.serviceId ?? s.serviceName ?? `service-${serviceIndex}`,
        label: s.serviceName ?? s.serviceId ?? 'Service',
        dataPoints: aggregateServiceReplicaDataPoints(s.replicas ?? []),
      }))

      const selectedKeys = selectedServiceKeysByHost[hostKey] ?? new Set<string>()
      const selectedEntities = allServices.filter((s) => selectedKeys.has(s.key))

      const buildChart = (metrics: ResourceMetricKey[]) => {
        const data = mergeResourceSeries(selectedEntities, metrics)
        const dataKeys = getMultiSeriesDataKeys(
          selectedEntities.map((e) => e.key),
          metrics,
        )
        return {
          data: applyMultiSeriesSlidingAverage(data, dataKeys, resourceSmoothingWindowSize),
          dataKeys,
        }
      }

      const containerCpu = buildChart(['cpuPercentage'])
      const containerMemory = buildChart(['memoryUsageBytes'])
      const containerNetwork = buildChart(['networkInBytes', 'networkOutBytes'])
      const containerBlock = buildChart(['blockInBytes', 'blockOutBytes'])

      const filterContainerData = <T extends { timestampMs: number | string }>(
        points: T[],
      ): T[] => {
        if (!brushTimeRange) return points
        return points.filter(
          (p) =>
            (p.timestampMs as number) >= brushTimeRange[0] &&
            (p.timestampMs as number) <= brushTimeRange[1],
        )
      }

      const visibleContainerCpuData = filterContainerData(containerCpu.data)
      const visibleContainerMemoryData = filterContainerData(containerMemory.data)
      const visibleContainerNetworkData = filterContainerData(containerNetwork.data)
      const visibleContainerBlockData = filterContainerData(containerBlock.data)

      const containerCpuDomain = resolveMultiSeriesYAxisDomain(
        visibleContainerCpuData, containerCpu.dataKeys, resourceAxisScaleMode,
      )
      const containerMemoryDomain = resolveMultiSeriesYAxisDomain(
        visibleContainerMemoryData, containerMemory.dataKeys, resourceAxisScaleMode,
      )
      const containerNetworkDomain = resolveMultiSeriesYAxisDomain(
        visibleContainerNetworkData, containerNetwork.dataKeys, resourceAxisScaleMode,
      )
      const containerBlockDomain = resolveMultiSeriesYAxisDomain(
        visibleContainerBlockData, containerBlock.dataKeys, resourceAxisScaleMode,
      )

      const containerCpuLines: ResourceLineConfig[] = selectedEntities.map(
        (s, i) => ({
          dataKey: `${s.key}_cpuPercentage`,
          name: s.label,
          color: RESOURCE_SERIES_COLORS[i % RESOURCE_SERIES_COLORS.length],
        }),
      )
      const containerMemoryLines: ResourceLineConfig[] = selectedEntities.map(
        (s, i) => ({
          dataKey: `${s.key}_memoryUsageBytes`,
          name: s.label,
          color: RESOURCE_SERIES_COLORS[i % RESOURCE_SERIES_COLORS.length],
        }),
      )
      const containerNetworkLines: ResourceLineConfig[] =
        selectedEntities.flatMap((s, i) => {
          const color = RESOURCE_SERIES_COLORS[i % RESOURCE_SERIES_COLORS.length]
          return [
            { dataKey: `${s.key}_networkInBytes`, name: `${s.label} (in)`, color },
            {
              dataKey: `${s.key}_networkOutBytes`,
              name: `${s.label} (out)`,
              color,
              strokeDasharray: '5 3',
            },
          ]
        })
      const containerBlockLines: ResourceLineConfig[] =
        selectedEntities.flatMap((s, i) => {
          const color = RESOURCE_SERIES_COLORS[i % RESOURCE_SERIES_COLORS.length]
          return [
            { dataKey: `${s.key}_blockInBytes`, name: `${s.label} (in)`, color },
            {
              dataKey: `${s.key}_blockOutBytes`,
              name: `${s.label} (out)`,
              color,
              strokeDasharray: '5 3',
            },
          ]
        })

      const derivedSummary = (derivedData?.hosts ?? []).find(
        (h) => (h.hostId ?? h.hostName) === hostKey,
      )

      return {
        key: hostKey,
        label: hostLabel,
        derivedSummary,
        visibleMachinePoints,
        hasMemoryLimit,
        allServices: allServices.map((s) => ({ key: s.key, label: s.label })),
        machineCpuDomain,
        machineMemoryDomain,
        machineMemoryLines,
        machineNetworkDomain,
        machineBlockDomain,
        visibleContainerCpuData,
        visibleContainerMemoryData,
        visibleContainerNetworkData,
        visibleContainerBlockData,
        containerCpuDomain,
        containerCpuLines,
        containerMemoryDomain,
        containerMemoryLines,
        containerNetworkDomain,
        containerNetworkLines,
        containerBlockDomain,
        containerBlockLines,
      }
    })
  }, [rawData, derivedData, selectedServiceKeysByHost, resourceSmoothingWindowSize, brushTimeRange, resourceAxisScaleMode])

  const handleToggleService = (hostKey: string, serviceKey: string) => {
    setSelectedServiceKeysByHost((current) => {
      const hostSet = new Set(current[hostKey] ?? [])
      if (hostSet.has(serviceKey)) {
        hostSet.delete(serviceKey)
      } else {
        hostSet.add(serviceKey)
      }
      return { ...current, [hostKey]: hostSet }
    })
  }

  const handleSelectAllServices = (hostKey: string, allKeys: string[]) => {
    setSelectedServiceKeysByHost((current) => ({
      ...current,
      [hostKey]: new Set(allKeys),
    }))
  }

  const handleSelectNoServices = (hostKey: string) => {
    setSelectedServiceKeysByHost((current) => ({
      ...current,
      [hostKey]: new Set<string>(),
    }))
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
                    {rawServiceCount}
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
                <ResponsiveContainer width="100%" height="100%">
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
          {processedHosts.length === 0 ? (
            <p className="run-results-placeholder">
              No host resource data is available for this run.
            </p>
          ) : (
            <>
              <div className="run-results-chart-controls">
                <div className="run-results-axis-mode-group" role="group" aria-label="Resource Y-axis scale">
                  {AXIS_MODE_OPTIONS.map((option) => {
                    const isSelected = resourceAxisScaleMode === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`shell-alert-dismiss run-results-axis-mode-button${
                          isSelected ? ' is-selected' : ''
                        }`}
                        onClick={() => setResourceAxisScaleMode(option.value)}
                        aria-pressed={isSelected}
                        title={option.description}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                <div className="run-results-axis-mode-group" role="group" aria-label="Resource render mode">
                  {CHART_RENDER_MODE_OPTIONS.map((option) => {
                    const isSelected = resourceChartRenderMode === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`shell-alert-dismiss run-results-axis-mode-button${
                          isSelected ? ' is-selected' : ''
                        }`}
                        onClick={() => setResourceChartRenderMode(option.value)}
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
                    htmlFor="run-results-resource-smoothing-slider"
                  >
                    Sliding average: {resourceSmoothingLevel === 0 ? 'Raw' : resourceSmoothingLevel}
                  </label>
                  <input
                    id="run-results-resource-smoothing-slider"
                    className="run-results-smoothing-slider-input"
                    type="range"
                    min={0}
                    max={9}
                    step={1}
                    value={resourceSmoothingLevel}
                    onChange={(event) => {
                      const nextLevel = Number(event.currentTarget.value)
                      if (!Number.isNaN(nextLevel)) {
                        setResourceSmoothingLevel(Math.min(Math.max(nextLevel, 0), 9))
                      }
                    }}
                    aria-label="Resource sliding average level from 0 to 9"
                  />
                  <div className="run-results-smoothing-slider-marks" aria-hidden="true">
                    <span>Raw</span>
                    <span>5</span>
                    <span>9</span>
                  </div>
                </div>
              </div>

              {processedHosts.map((host) => {
                const selectedKeys = selectedServiceKeysByHost[host.key] ?? new Set<string>()
                const resourceShowPointsOnly = resourceChartRenderMode === 'points'

                const derivedCpu = host.derivedSummary?.resource?.cpu
                const derivedMemory = host.derivedSummary?.resource?.memory

                return (
                  <details key={host.key} className="run-results-host-card" open>
                    <summary className="run-results-host-card-summary">
                      <span className="run-results-host-card-name">{host.label}</span>
                      <span className="run-results-host-card-stats">
                        CPU avg {formatMetric(derivedCpu?.avg, '%')} | Mem avg{' '}
                        {formatMetric(derivedMemory?.avg, '%')}
                        {' | '}
                        Net in {formatBytes(host.derivedSummary?.resource?.networkInTotalBytes)}{' '}
                        | Net out{' '}
                        {formatBytes(host.derivedSummary?.resource?.networkOutTotalBytes)}
                      </span>
                    </summary>

                    <div className="run-results-host-machine-section">
                      <h4>Machine</h4>
                      <div className="run-results-resource-grid">
                        <ResourceChart
                          title="CPU %"
                          data={host.visibleMachinePoints}
                          lines={[
                            { dataKey: 'cpuPercentage', name: 'CPU %', color: '#2563eb' },
                          ]}
                          yAxisDomain={host.machineCpuDomain}
                          yAxisFormatter={(v) => `${Math.round(v)}%`}
                          tooltipFormatter={cpuTooltipFormatter}
                          showPointsOnly={resourceShowPointsOnly}
                        />
                        <ResourceChart
                          title="Memory"
                          data={host.visibleMachinePoints}
                          lines={host.machineMemoryLines}
                          yAxisDomain={host.machineMemoryDomain}
                          yAxisFormatter={(v) => formatBytes(v)}
                          tooltipFormatter={byteTooltipFormatter}
                          showPointsOnly={resourceShowPointsOnly}
                        />
                        <ResourceChart
                          title="Network I/O"
                          data={host.visibleMachinePoints}
                          lines={[
                            { dataKey: 'networkInBytes', name: 'In', color: '#16a34a' },
                            { dataKey: 'networkOutBytes', name: 'Out', color: '#f97316' },
                          ]}
                          yAxisDomain={host.machineNetworkDomain}
                          yAxisFormatter={(v) => formatBytes(v)}
                          tooltipFormatter={byteTooltipFormatter}
                          showPointsOnly={resourceShowPointsOnly}
                        />
                        <ResourceChart
                          title="Block I/O"
                          data={host.visibleMachinePoints}
                          lines={[
                            { dataKey: 'blockInBytes', name: 'In', color: '#06b6d4' },
                            { dataKey: 'blockOutBytes', name: 'Out', color: '#d97706' },
                          ]}
                          yAxisDomain={host.machineBlockDomain}
                          yAxisFormatter={(v) => formatBytes(v)}
                          tooltipFormatter={byteTooltipFormatter}
                          showPointsOnly={resourceShowPointsOnly}
                        />
                      </div>
                    </div>

                    <div className="run-results-host-container-section">
                      <h4>Containers</h4>
                      {host.allServices.length === 0 ? (
                        <p className="run-results-placeholder">
                          No containers recorded for this host.
                        </p>
                      ) : (
                        <>
                          <div className="run-results-service-selector">
                            <button
                              type="button"
                              className="shell-alert-dismiss run-results-service-pill"
                              onClick={() =>
                                handleSelectAllServices(
                                  host.key,
                                  host.allServices.map((s) => s.key),
                                )
                              }
                            >
                              Select all
                            </button>
                            <button
                              type="button"
                              className="shell-alert-dismiss run-results-service-pill"
                              onClick={() => handleSelectNoServices(host.key)}
                            >
                              Select none
                            </button>
                            {host.allServices.map((service) => (
                              <button
                                key={service.key}
                                type="button"
                                aria-pressed={selectedKeys.has(service.key)}
                                className={`shell-alert-dismiss run-results-service-pill${
                                  selectedKeys.has(service.key) ? ' is-selected' : ''
                                }`}
                                onClick={() => handleToggleService(host.key, service.key)}
                              >
                                {service.label}
                              </button>
                            ))}
                          </div>
                          {selectedKeys.size === 0 ? (
                            <p className="run-results-placeholder">No services selected.</p>
                          ) : (
                            <div className="run-results-resource-grid">
                              <ResourceChart
                                title="CPU %"
                                data={host.visibleContainerCpuData}
                                lines={host.containerCpuLines}
                                yAxisDomain={host.containerCpuDomain}
                                yAxisFormatter={(v) => `${Math.round(v)}%`}
                                tooltipFormatter={cpuTooltipFormatter}
                                showPointsOnly={resourceShowPointsOnly}
                              />
                              <ResourceChart
                                title="Memory"
                                data={host.visibleContainerMemoryData}
                                lines={host.containerMemoryLines}
                                yAxisDomain={host.containerMemoryDomain}
                                yAxisFormatter={(v) => formatBytes(v)}
                                tooltipFormatter={byteTooltipFormatter}
                                showPointsOnly={resourceShowPointsOnly}
                              />
                              <ResourceChart
                                title="Network I/O"
                                data={host.visibleContainerNetworkData}
                                lines={host.containerNetworkLines}
                                yAxisDomain={host.containerNetworkDomain}
                                yAxisFormatter={(v) => formatBytes(v)}
                                tooltipFormatter={byteTooltipFormatter}
                                showPointsOnly={resourceShowPointsOnly}
                              />
                              <ResourceChart
                                title="Block I/O"
                                data={host.visibleContainerBlockData}
                                lines={host.containerBlockLines}
                                yAxisDomain={host.containerBlockDomain}
                                yAxisFormatter={(v) => formatBytes(v)}
                                tooltipFormatter={byteTooltipFormatter}
                                showPointsOnly={resourceShowPointsOnly}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </details>
                )
              })}
            </>
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
