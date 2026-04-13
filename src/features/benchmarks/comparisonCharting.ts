import type { BenchmarkRunRawDTO } from '../../generated/openapi/models/BenchmarkRunRawDTO'
import {
  type AxisDomain,
  type AxisScaleMode,
  type K6ChartPoint,
  normalizeK6ChartPoints,
} from './charting'

export interface ComparisonChartPoint {
  elapsedMs: number
  elapsedLabel: string
  httpResponseTimeMs_A: number | null
  httpWaitingMs_A: number | null
  vus_A: number | null
  httpResponseTimeMs_B: number | null
  httpWaitingMs_B: number | null
  vus_B: number | null
}

export type ComparisonMetricKey =
  | 'httpResponseTimeMs_A'
  | 'httpWaitingMs_A'
  | 'vus_A'
  | 'httpResponseTimeMs_B'
  | 'httpWaitingMs_B'
  | 'vus_B'

export const COMPARISON_MS_METRICS: ReadonlyArray<ComparisonMetricKey> = [
  'httpResponseTimeMs_A',
  'httpWaitingMs_A',
  'httpResponseTimeMs_B',
  'httpWaitingMs_B',
]

export const COMPARISON_VUS_METRICS: ReadonlyArray<ComparisonMetricKey> = [
  'vus_A',
  'vus_B',
]

function formatElapsedLabel(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
  }
  return `${seconds}s`
}

function toElapsedPoints(points: ReadonlyArray<K6ChartPoint>): Array<{ elapsedMs: number; point: K6ChartPoint }> {
  if (points.length === 0) return []
  const baseMs = points[0].timestampMs
  return points.map((p) => ({
    elapsedMs: p.timestampMs - baseMs,
    point: p,
  }))
}

export function mergeK6ChartPointsByElapsed(
  rawA: BenchmarkRunRawDTO | null,
  rawB: BenchmarkRunRawDTO | null,
): Array<ComparisonChartPoint> {
  const pointsA = normalizeK6ChartPoints(rawA)
  const pointsB = normalizeK6ChartPoints(rawB)

  const elapsedA = toElapsedPoints(pointsA)
  const elapsedB = toElapsedPoints(pointsB)

  const merged = new Map<number, ComparisonChartPoint>()

  for (const { elapsedMs, point } of elapsedA) {
    merged.set(elapsedMs, {
      elapsedMs,
      elapsedLabel: formatElapsedLabel(elapsedMs),
      httpResponseTimeMs_A: point.httpResponseTimeMs,
      httpWaitingMs_A: point.httpWaitingMs,
      vus_A: point.vus,
      httpResponseTimeMs_B: null,
      httpWaitingMs_B: null,
      vus_B: null,
    })
  }

  for (const { elapsedMs, point } of elapsedB) {
    const existing = merged.get(elapsedMs)
    if (existing) {
      existing.httpResponseTimeMs_B = point.httpResponseTimeMs
      existing.httpWaitingMs_B = point.httpWaitingMs
      existing.vus_B = point.vus
    } else {
      merged.set(elapsedMs, {
        elapsedMs,
        elapsedLabel: formatElapsedLabel(elapsedMs),
        httpResponseTimeMs_A: null,
        httpWaitingMs_A: null,
        vus_A: null,
        httpResponseTimeMs_B: point.httpResponseTimeMs,
        httpWaitingMs_B: point.httpWaitingMs,
        vus_B: point.vus,
      })
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.elapsedMs - b.elapsedMs)
}

function withTightPadding(min: number, max: number): AxisDomain {
  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.1, 1)
    return [min - padding, max + padding]
  }

  const padding = Math.max((max - min) * 0.08, 1)
  return [min - padding, max + padding]
}

const AUTO_DOMAIN: AxisDomain = ['auto', 'auto']

export function resolveComparisonYAxisDomain(
  points: ReadonlyArray<ComparisonChartPoint>,
  metrics: ReadonlyArray<ComparisonMetricKey>,
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

  if (!hasValue) {
    return AUTO_DOMAIN
  }

  if (mode === 'from-zero') {
    const paddedMax = max <= 0 ? 1 : max + Math.max(max * 0.05, 1)
    return [0, paddedMax]
  }

  return withTightPadding(min, max)
}

export function applyComparisonSlidingAverage(
  points: ReadonlyArray<ComparisonChartPoint>,
  windowSize: number,
): Array<ComparisonChartPoint> {
  if (windowSize <= 1 || points.length === 0) {
    return [...points]
  }

  const ALL_METRICS: ReadonlyArray<ComparisonMetricKey> = [
    ...COMPARISON_MS_METRICS,
    ...COMPARISON_VUS_METRICS,
  ]

  const normalizedWindowSize = Math.max(Math.floor(windowSize), 1)
  const leftWindowSize = Math.floor((normalizedWindowSize - 1) / 2)
  const rightWindowSize = Math.ceil((normalizedWindowSize - 1) / 2)

  return points.map((point, index) => {
    const startIndex = Math.max(index - leftWindowSize, 0)
    const endIndex = Math.min(index + rightWindowSize, points.length - 1)

    const averaged: ComparisonChartPoint = { ...point }

    for (const metric of ALL_METRICS) {
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
