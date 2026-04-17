import type { RawResourceDataPointDTO } from '../../generated/openapi/models/RawResourceDataPointDTO'
import { formatReadableTimestamp } from '../dateTime'
import type { AxisDomain, AxisScaleMode } from './charting'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResourceMetricKey =
  | 'cpuPercentage'
  | 'memoryUsageBytes'
  | 'memoryLimitBytes'
  | 'networkInBytes'
  | 'networkOutBytes'
  | 'blockInBytes'
  | 'blockOutBytes'

export interface ResourceChartPoint {
  timestampMs: number
  timestampLabel: string
  cpuPercentage: number | null
  memoryUsageBytes: number | null
  memoryLimitBytes: number | null
  networkInBytes: number | null
  networkOutBytes: number | null
  blockInBytes: number | null
  blockOutBytes: number | null
}

export interface MultiSeriesResourcePoint {
  timestampMs: number
  timestampLabel: string
  [dataKey: string]: string | number | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_RESOURCE_METRICS: ReadonlyArray<ResourceMetricKey> = [
  'cpuPercentage',
  'memoryUsageBytes',
  'memoryLimitBytes',
  'networkInBytes',
  'networkOutBytes',
  'blockInBytes',
  'blockOutBytes',
]

const AUTO_DOMAIN: AxisDomain = ['auto', 'auto']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNumericValue(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null
  }
  return value
}

function withTightPadding(min: number, max: number): AxisDomain {
  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.1, 1)
    const paddedMin = min - padding
    return [min >= 0 ? Math.max(0, paddedMin) : paddedMin, max + padding]
  }
  const padding = Math.max((max - min) * 0.08, 1)
  const paddedMin = min - padding
  return [min >= 0 ? Math.max(0, paddedMin) : paddedMin, max + padding]
}

function computeDomain(
  min: number,
  max: number,
  hasValue: boolean,
  mode: AxisScaleMode,
): AxisDomain {
  if (!hasValue) {
    return AUTO_DOMAIN
  }
  if (mode === 'from-zero') {
    const paddedMax = max <= 0 ? 1 : max + Math.max(max * 0.05, 1)
    return [0, paddedMax]
  }
  return withTightPadding(min, max)
}

// ---------------------------------------------------------------------------
// Single-entity (machine) charting
// ---------------------------------------------------------------------------

export function normalizeResourceDataPoints(
  dataPoints: ReadonlyArray<RawResourceDataPointDTO>,
): Array<ResourceChartPoint> {
  const points: Array<ResourceChartPoint> = []

  for (const point of dataPoints) {
    const timestamp = point.timestamp ? new Date(point.timestamp) : null
    if (!timestamp || Number.isNaN(timestamp.getTime())) {
      continue
    }

    points.push({
      timestampMs: timestamp.getTime(),
      timestampLabel: formatReadableTimestamp(timestamp) ?? timestamp.toISOString(),
      cpuPercentage: toNumericValue(point.cpuPercentage),
      memoryUsageBytes: toNumericValue(point.memoryUsageBytes),
      memoryLimitBytes: toNumericValue(point.memoryLimitBytes),
      networkInBytes: toNumericValue(point.networkInBytes),
      networkOutBytes: toNumericValue(point.networkOutBytes),
      blockInBytes: toNumericValue(point.blockInBytes),
      blockOutBytes: toNumericValue(point.blockOutBytes),
    })
  }

  points.sort((a, b) => a.timestampMs - b.timestampMs)
  return points
}

export function applyResourceSlidingAverage(
  points: ReadonlyArray<ResourceChartPoint>,
  windowSize: number,
): Array<ResourceChartPoint> {
  if (windowSize <= 1 || points.length === 0) {
    return [...points]
  }

  const normalizedWindowSize = Math.max(Math.floor(windowSize), 1)
  const leftWindowSize = Math.floor((normalizedWindowSize - 1) / 2)
  const rightWindowSize = Math.ceil((normalizedWindowSize - 1) / 2)

  return points.map((point, index) => {
    const startIndex = Math.max(index - leftWindowSize, 0)
    const endIndex = Math.min(index + rightWindowSize, points.length - 1)
    const averaged: ResourceChartPoint = { ...point }

    for (const metric of ALL_RESOURCE_METRICS) {
      let sum = 0
      let count = 0
      for (let i = startIndex; i <= endIndex; i += 1) {
        const value = points[i][metric]
        if (value != null && !Number.isNaN(value)) {
          sum += value
          count += 1
        }
      }
      averaged[metric] = count > 0 ? sum / count : null
    }

    return averaged
  })
}

export function resolveResourceYAxisDomain(
  points: ReadonlyArray<ResourceChartPoint>,
  metrics: ReadonlyArray<ResourceMetricKey>,
  mode: AxisScaleMode,
): AxisDomain {
  if (mode === 'auto') {
    return AUTO_DOMAIN
  }

  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  let hasValue = false

  for (const point of points) {
    for (const metric of metrics) {
      const value = point[metric]
      if (value != null && !Number.isNaN(value)) {
        if (value < min) min = value
        if (value > max) max = value
        hasValue = true
      }
    }
  }

  return computeDomain(min, max, hasValue, mode)
}

// ---------------------------------------------------------------------------
// Multi-entity (container) charting
// ---------------------------------------------------------------------------

/**
 * Returns the data-key strings used inside a merged multi-series point.
 * For each entity × metric combination: `"${entityKey}_${metric}"`.
 */
export function getMultiSeriesDataKeys(
  entityKeys: ReadonlyArray<string>,
  metrics: ReadonlyArray<ResourceMetricKey>,
): Array<string> {
  const keys: Array<string> = []
  for (const entityKey of entityKeys) {
    for (const metric of metrics) {
      keys.push(`${entityKey}_${metric}`)
    }
  }
  return keys
}

/**
 * Merges multiple entities' resource data points into a single time-aligned
 * array suitable for rendering a Recharts chart with one `<Line>` per
 * entity+metric combination. Data keys follow the pattern
 * `"${entityKey}_${metricKey}"`.
 */
export function mergeResourceSeries(
  entities: ReadonlyArray<{
    key: string
    dataPoints: ReadonlyArray<RawResourceDataPointDTO>
  }>,
  metrics: ReadonlyArray<ResourceMetricKey>,
): Array<MultiSeriesResourcePoint> {
  const merged = new Map<number, MultiSeriesResourcePoint>()
  const allDataKeys = getMultiSeriesDataKeys(
    entities.map((e) => e.key),
    metrics,
  )

  for (const entity of entities) {
    const normalized = normalizeResourceDataPoints(entity.dataPoints)
    for (const point of normalized) {
      let row = merged.get(point.timestampMs)
      if (!row) {
        row = {
          timestampMs: point.timestampMs,
          timestampLabel: point.timestampLabel,
        }
        merged.set(point.timestampMs, row)
      }
      for (const metric of metrics) {
        row[`${entity.key}_${metric}`] = point[metric]
      }
    }
  }

  // Fill missing data keys with null so every row has every key
  for (const row of merged.values()) {
    for (const dataKey of allDataKeys) {
      if (!(dataKey in row)) {
        row[dataKey] = null
      }
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => (a.timestampMs as number) - (b.timestampMs as number),
  )
}

export function applyMultiSeriesSlidingAverage(
  points: ReadonlyArray<MultiSeriesResourcePoint>,
  seriesKeys: ReadonlyArray<string>,
  windowSize: number,
): Array<MultiSeriesResourcePoint> {
  if (windowSize <= 1 || points.length === 0) {
    return points.map((p) => ({ ...p }))
  }

  const normalizedWindowSize = Math.max(Math.floor(windowSize), 1)
  const leftWindowSize = Math.floor((normalizedWindowSize - 1) / 2)
  const rightWindowSize = Math.ceil((normalizedWindowSize - 1) / 2)

  return points.map((point, index) => {
    const startIndex = Math.max(index - leftWindowSize, 0)
    const endIndex = Math.min(index + rightWindowSize, points.length - 1)
    const averaged: MultiSeriesResourcePoint = {
      timestampMs: point.timestampMs,
      timestampLabel: point.timestampLabel,
    }

    for (const key of seriesKeys) {
      let sum = 0
      let count = 0
      for (let i = startIndex; i <= endIndex; i += 1) {
        const value = points[i][key]
        if (typeof value === 'number' && !Number.isNaN(value)) {
          sum += value
          count += 1
        }
      }
      averaged[key] = count > 0 ? sum / count : null
    }

    return averaged
  })
}

export function resolveMultiSeriesYAxisDomain(
  points: ReadonlyArray<MultiSeriesResourcePoint>,
  seriesKeys: ReadonlyArray<string>,
  mode: AxisScaleMode,
): AxisDomain {
  if (mode === 'auto') {
    return AUTO_DOMAIN
  }

  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  let hasValue = false

  for (const point of points) {
    for (const key of seriesKeys) {
      const value = point[key]
      if (typeof value === 'number' && !Number.isNaN(value)) {
        if (value < min) min = value
        if (value > max) max = value
        hasValue = true
      }
    }
  }

  return computeDomain(min, max, hasValue, mode)
}
