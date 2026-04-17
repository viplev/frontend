import type { BenchmarkRunDerivedDTO } from '../../generated/openapi/models/BenchmarkRunDerivedDTO'
import type { BenchmarkRunRawDTO } from '../../generated/openapi/models/BenchmarkRunRawDTO'
import type { DerivedHostSummaryDTO } from '../../generated/openapi/models/DerivedHostSummaryDTO'
import type { RawResourceDataPointDTO } from '../../generated/openapi/models/RawResourceDataPointDTO'
import type { AxisDomain, AxisScaleMode } from './charting'
import { normalizeResourceDataPoints } from './resourceCharting'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResourceComparisonPoint {
  elapsedMs: number
  elapsedLabel: string
  cpuPercentage_A: number | null
  cpuPercentage_B: number | null
  memoryUsageBytes_A: number | null
  memoryUsageBytes_B: number | null
  memoryLimitBytes_A: number | null
  memoryLimitBytes_B: number | null
  networkInBytes_A: number | null
  networkInBytes_B: number | null
  networkOutBytes_A: number | null
  networkOutBytes_B: number | null
  blockInBytes_A: number | null
  blockInBytes_B: number | null
  blockOutBytes_A: number | null
  blockOutBytes_B: number | null
}

export type ResourceComparisonMetricKey = keyof Omit<ResourceComparisonPoint, 'elapsedMs' | 'elapsedLabel'>

export interface MatchedServiceComparison {
  serviceKey: string
  serviceName: string
  hasA: boolean
  hasB: boolean
  baseComparisonPoints: ResourceComparisonPoint[]
}

export interface MatchedHostComparison {
  hostKey: string
  hostName: string
  hasA: boolean
  hasB: boolean
  derivedA: DerivedHostSummaryDTO | null
  derivedB: DerivedHostSummaryDTO | null
  hasMemoryLimitA: boolean
  hasMemoryLimitB: boolean
  baseComparisonPoints: ResourceComparisonPoint[]
  services: MatchedServiceComparison[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_RESOURCE_COMPARISON_METRICS: ReadonlyArray<ResourceComparisonMetricKey> = [
  'cpuPercentage_A',
  'cpuPercentage_B',
  'memoryUsageBytes_A',
  'memoryUsageBytes_B',
  'memoryLimitBytes_A',
  'memoryLimitBytes_B',
  'networkInBytes_A',
  'networkInBytes_B',
  'networkOutBytes_A',
  'networkOutBytes_B',
  'blockInBytes_A',
  'blockInBytes_B',
  'blockOutBytes_A',
  'blockOutBytes_B',
]

const AUTO_DOMAIN: AxisDomain = ['auto', 'auto']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatElapsedLabel(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
  }
  return `${seconds}s`
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

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

export function mergeResourceComparisonByElapsed(
  rawDataPointsA: ReadonlyArray<RawResourceDataPointDTO> | undefined,
  rawDataPointsB: ReadonlyArray<RawResourceDataPointDTO> | undefined,
): Array<ResourceComparisonPoint> {
  const normalizedA = normalizeResourceDataPoints(rawDataPointsA ?? [])
  const normalizedB = normalizeResourceDataPoints(rawDataPointsB ?? [])

  const baseA = normalizedA.length > 0 ? normalizedA[0].timestampMs : 0
  const baseB = normalizedB.length > 0 ? normalizedB[0].timestampMs : 0

  const merged = new Map<number, ResourceComparisonPoint>()

  for (const point of normalizedA) {
    const elapsedMs = point.timestampMs - baseA
    merged.set(elapsedMs, {
      elapsedMs,
      elapsedLabel: formatElapsedLabel(elapsedMs),
      cpuPercentage_A: point.cpuPercentage,
      cpuPercentage_B: null,
      memoryUsageBytes_A: point.memoryUsageBytes,
      memoryUsageBytes_B: null,
      memoryLimitBytes_A: point.memoryLimitBytes,
      memoryLimitBytes_B: null,
      networkInBytes_A: point.networkInBytes,
      networkInBytes_B: null,
      networkOutBytes_A: point.networkOutBytes,
      networkOutBytes_B: null,
      blockInBytes_A: point.blockInBytes,
      blockInBytes_B: null,
      blockOutBytes_A: point.blockOutBytes,
      blockOutBytes_B: null,
    })
  }

  for (const point of normalizedB) {
    const elapsedMs = point.timestampMs - baseB
    const existing = merged.get(elapsedMs)
    if (existing) {
      existing.cpuPercentage_B = point.cpuPercentage
      existing.memoryUsageBytes_B = point.memoryUsageBytes
      existing.memoryLimitBytes_B = point.memoryLimitBytes
      existing.networkInBytes_B = point.networkInBytes
      existing.networkOutBytes_B = point.networkOutBytes
      existing.blockInBytes_B = point.blockInBytes
      existing.blockOutBytes_B = point.blockOutBytes
    } else {
      merged.set(elapsedMs, {
        elapsedMs,
        elapsedLabel: formatElapsedLabel(elapsedMs),
        cpuPercentage_A: null,
        cpuPercentage_B: point.cpuPercentage,
        memoryUsageBytes_A: null,
        memoryUsageBytes_B: point.memoryUsageBytes,
        memoryLimitBytes_A: null,
        memoryLimitBytes_B: point.memoryLimitBytes,
        networkInBytes_A: null,
        networkInBytes_B: point.networkInBytes,
        networkOutBytes_A: null,
        networkOutBytes_B: point.networkOutBytes,
        blockInBytes_A: null,
        blockInBytes_B: point.blockInBytes,
        blockOutBytes_A: null,
        blockOutBytes_B: point.blockOutBytes,
      })
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.elapsedMs - b.elapsedMs)
}

// ---------------------------------------------------------------------------
// Host / service matching
// ---------------------------------------------------------------------------

export function matchHosts(
  rawA: BenchmarkRunRawDTO | null,
  rawB: BenchmarkRunRawDTO | null,
  derivedA: BenchmarkRunDerivedDTO | null,
  derivedB: BenchmarkRunDerivedDTO | null,
): Array<MatchedHostComparison> {
  const hostsA = rawA?.timeSeries?.hosts ?? []
  const hostsB = rawB?.timeSeries?.hosts ?? []
  const derivedHostsA = derivedA?.hosts ?? []
  const derivedHostsB = derivedB?.hosts ?? []

  type RawHost = (typeof hostsA)[number]
  const hostMapA = new Map<string, RawHost>()
  const hostMapB = new Map<string, RawHost>()

  for (const host of hostsA) {
    const key = host.hostName ?? host.hostId
    if (key) hostMapA.set(key, host)
  }
  for (const host of hostsB) {
    const key = host.hostName ?? host.hostId
    if (key) hostMapB.set(key, host)
  }

  const allHostKeys = new Set<string>([...hostMapA.keys(), ...hostMapB.keys()])
  const result: MatchedHostComparison[] = []

  for (const hostKey of allHostKeys) {
    const rawHostA = hostMapA.get(hostKey)
    const rawHostB = hostMapB.get(hostKey)

    const derivedHostA = derivedHostsA.find((h) => (h.hostName ?? h.hostId) === hostKey) ?? null
    const derivedHostB = derivedHostsB.find((h) => (h.hostName ?? h.hostId) === hostKey) ?? null

    const baseComparisonPoints = mergeResourceComparisonByElapsed(
      rawHostA?.dataPoints,
      rawHostB?.dataPoints,
    )

    const hasMemoryLimitA = baseComparisonPoints.some(
      (p) => p.memoryLimitBytes_A != null && p.memoryLimitBytes_A > 0,
    )
    const hasMemoryLimitB = baseComparisonPoints.some(
      (p) => p.memoryLimitBytes_B != null && p.memoryLimitBytes_B > 0,
    )

    type RawService = NonNullable<RawHost['services']>[number]
    const serviceMapA = new Map<string, RawService>()
    const serviceMapB = new Map<string, RawService>()

    for (const svc of rawHostA?.services ?? []) {
      const key = svc.serviceName ?? svc.serviceId
      if (key) serviceMapA.set(key, svc)
    }
    for (const svc of rawHostB?.services ?? []) {
      const key = svc.serviceName ?? svc.serviceId
      if (key) serviceMapB.set(key, svc)
    }

    const allServiceKeys = new Set<string>([...serviceMapA.keys(), ...serviceMapB.keys()])
    const services: MatchedServiceComparison[] = []

    for (const serviceKey of allServiceKeys) {
      const svcA = serviceMapA.get(serviceKey)
      const svcB = serviceMapB.get(serviceKey)
      services.push({
        serviceKey,
        serviceName: serviceKey,
        hasA: svcA != null,
        hasB: svcB != null,
        baseComparisonPoints: mergeResourceComparisonByElapsed(svcA?.dataPoints, svcB?.dataPoints),
      })
    }

    services.sort((a, b) => a.serviceKey.localeCompare(b.serviceKey))

    result.push({
      hostKey,
      hostName: hostKey,
      hasA: rawHostA != null,
      hasB: rawHostB != null,
      derivedA: derivedHostA,
      derivedB: derivedHostB,
      hasMemoryLimitA,
      hasMemoryLimitB,
      baseComparisonPoints,
      services,
    })
  }

  result.sort((a, b) => a.hostKey.localeCompare(b.hostKey))
  return result
}

// ---------------------------------------------------------------------------
// Smoothing
// ---------------------------------------------------------------------------

export function applyResourceComparisonSlidingAverage(
  points: ReadonlyArray<ResourceComparisonPoint>,
  windowSize: number,
): Array<ResourceComparisonPoint> {
  if (windowSize <= 1 || points.length === 0) {
    return [...points]
  }

  const normalizedWindowSize = Math.max(Math.floor(windowSize), 1)
  const leftWindowSize = Math.floor((normalizedWindowSize - 1) / 2)
  const rightWindowSize = Math.ceil((normalizedWindowSize - 1) / 2)

  return points.map((point, index) => {
    const startIndex = Math.max(index - leftWindowSize, 0)
    const endIndex = Math.min(index + rightWindowSize, points.length - 1)
    const averaged: ResourceComparisonPoint = { ...point }

    for (const metric of ALL_RESOURCE_COMPARISON_METRICS) {
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

// ---------------------------------------------------------------------------
// Y-axis domain
// ---------------------------------------------------------------------------

export function resolveResourceComparisonYAxisDomain(
  points: ReadonlyArray<ResourceComparisonPoint>,
  metrics: ReadonlyArray<ResourceComparisonMetricKey>,
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
