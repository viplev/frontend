function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  const payloadSegment = parts[1]
  const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  )

  try {
    const decoded = atob(padded)
    const parsed = JSON.parse(decoded)
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

export function isTokenExpired(token: string, nowUnixSeconds = Date.now() / 1000): boolean {
  const payload = parseJwtPayload(token)
  if (!payload) {
    return true
  }

  const exp = payload.exp
  if (typeof exp !== 'number') {
    return true
  }

  return exp <= nowUnixSeconds
}

