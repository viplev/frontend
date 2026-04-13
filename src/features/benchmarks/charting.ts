import type { BenchmarkRunRawDTO } from '../../generated/openapi/models/BenchmarkRunRawDTO'
import { formatReadableTimestamp } from '../dateTime'

export type AxisScaleMode = 'auto' | 'from-zero' | 'tight'
export type AxisDomain = [number | 'auto', number | 'auto']
export type K6MetricKey = 'httpResponseTimeMs' | 'httpWaitingMs' | 'vus'

export interface K6ChartPoint {
  timestampMs: number
  timestampLabel: string
  httpResponseTimeMs: number | null
  httpWaitingMs: number | null
  vus: number | null
}

export const K6_MS_METRICS: ReadonlyArray<K6MetricKey> = [
  'httpResponseTimeMs',
  'httpWaitingMs',
]
export const K6_VUS_METRICS: ReadonlyArray<K6MetricKey> = ['vus']
const K6_ALL_METRICS: ReadonlyArray<K6MetricKey> = [
  'httpResponseTimeMs',
  'httpWaitingMs',
  'vus',
]

const AUTO_DOMAIN: AxisDomain = ['auto', 'auto']

function toNumericValue(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null
  }

  return value
}

export function normalizeK6ChartPoints(rawData: BenchmarkRunRawDTO | null): Array<K6ChartPoint> {
  const rawPoints = rawData?.timeSeries?.k6?.dataPoints ?? []
  const points: Array<K6ChartPoint> = []

  for (const point of rawPoints) {
    const timestamp = point.timestamp ? new Date(point.timestamp) : null
    if (!timestamp || Number.isNaN(timestamp.getTime())) {
      continue
    }

    points.push({
      timestampMs: timestamp.getTime(),
      timestampLabel: formatReadableTimestamp(timestamp) ?? timestamp.toISOString(),
      httpResponseTimeMs: toNumericValue(point.httpResponseTimeMs),
      httpWaitingMs: toNumericValue(point.httpWaitingMs),
      vus: toNumericValue(point.vus),
    })
  }

  points.sort((a, b) => a.timestampMs - b.timestampMs)
  return points
}

function withTightPadding(min: number, max: number): AxisDomain {
  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.1, 1)
    return [min - padding, max + padding]
  }

  const padding = Math.max((max - min) * 0.08, 1)
  return [min - padding, max + padding]
}

export function resolveYAxisDomain(
  points: ReadonlyArray<K6ChartPoint>,
  metrics: ReadonlyArray<K6MetricKey>,
  mode: AxisScaleMode,
): AxisDomain {
  if (mode === 'auto') {
    return AUTO_DOMAIN
  }

  const values: Array<number> = []
  for (const point of points) {
    for (const metric of metrics) {
      const value = point[metric]
      if (value != null && !Number.isNaN(value)) {
        values.push(value)
      }
    }
  }

  if (values.length === 0) {
    return AUTO_DOMAIN
  }

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (mode === 'from-zero') {
    const paddedMax = max <= 0 ? 1 : max + Math.max(max * 0.05, 1)
    return [0, paddedMax]
  }

  return withTightPadding(min, max)
}

function averageMetric(
  points: ReadonlyArray<K6ChartPoint>,
  metric: K6MetricKey,
  startIndex: number,
  endIndex: number,
): number | null {
  let sum = 0
  let count = 0

  for (let index = startIndex; index <= endIndex; index += 1) {
    const value = points[index]?.[metric]
    if (value != null && !Number.isNaN(value)) {
      sum += value
      count += 1
    }
  }

  if (count === 0) {
    return null
  }

  return sum / count
}

export function applyK6SlidingAverage(
  points: ReadonlyArray<K6ChartPoint>,
  windowSize: number,
): Array<K6ChartPoint> {
  if (windowSize <= 1 || points.length === 0) {
    return [...points]
  }

  const normalizedWindowSize = Math.max(Math.floor(windowSize), 1)
  const leftWindowSize = Math.floor((normalizedWindowSize - 1) / 2)
  const rightWindowSize = Math.ceil((normalizedWindowSize - 1) / 2)

  return points.map((point, index) => {
    const startIndex = Math.max(index - leftWindowSize, 0)
    const endIndex = Math.min(index + rightWindowSize, points.length - 1)
    const averagedPoint: K6ChartPoint = {
      ...point,
    }

    for (const metric of K6_ALL_METRICS) {
      averagedPoint[metric] = averageMetric(points, metric, startIndex, endIndex)
    }

    return averagedPoint
  })
}
