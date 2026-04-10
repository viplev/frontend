const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export function formatTimestamp(value?: Date | string): string {
  if (!value) {
    return 'n/a'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'n/a'
  }

  return TIMESTAMP_FORMATTER.format(parsed)
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
