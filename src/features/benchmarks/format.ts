import { formatReadableTimestamp } from '../dateTime'

export function formatTimestamp(value?: Date | string): string {
  return formatReadableTimestamp(value) ?? 'n/a'
}

export function formatDelta(
  a: number | undefined | null,
  b: number | undefined | null,
  unit = '',
): string {
  if (a == null || b == null || Number.isNaN(a) || Number.isNaN(b)) {
    return 'n/a'
  }

  const diff = b - a
  const sign = diff >= 0 ? '+' : '−'
  const absDiff = Math.abs(diff)

  let percentPart = ''
  if (a !== 0) {
    const percent = Math.abs((diff / a) * 100)
    const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : ''
    percentPart = arrow ? ` (${arrow} ${percent.toFixed(1)}%)` : ' (0.0%)'
  }

  return `${sign}${absDiff.toFixed(2)}${unit ? ` ${unit}` : ''}${percentPart}`
}

export function formatRunStatus(status?: string): string {
  if (!status) {
    return 'Unknown'
  }

  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatRuntimeDuration(
  startedAt?: Date | string,
  finishedAt?: Date | string,
): string | null {
  if (!startedAt || !finishedAt) {
    return null
  }

  const startedDate = new Date(startedAt)
  const finishedDate = new Date(finishedAt)
  if (
    Number.isNaN(startedDate.getTime()) ||
    Number.isNaN(finishedDate.getTime())
  ) {
    return null
  }

  const durationMs = finishedDate.getTime() - startedDate.getTime()
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
