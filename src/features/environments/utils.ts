import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'

const AGENT_ACTIVE_THRESHOLD_MINUTES = 2

export function getTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function isEnvironmentLike(value: unknown): value is EnvironmentDTO {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as { name?: unknown; type?: unknown }
  return typeof candidate.name === 'string' && typeof candidate.type === 'string'
}

export function resolveAgentStatus(
  lastSeenAt?: Date | string,
): { label: string; variant: 'active' | 'inactive' | 'never' } {
  if (!lastSeenAt) {
    return { label: 'Agent: Never seen', variant: 'never' }
  }

  const parsed = new Date(lastSeenAt)
  if (Number.isNaN(parsed.getTime())) {
    return { label: 'Agent: Never seen', variant: 'never' }
  }

  const minutesSinceSeen = (Date.now() - parsed.getTime()) / 60000
  if (minutesSinceSeen <= AGENT_ACTIVE_THRESHOLD_MINUTES) {
    return { label: 'Agent: Active', variant: 'active' }
  }

  return { label: 'Agent: Inactive', variant: 'inactive' }
}
