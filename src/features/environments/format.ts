import { formatReadableTimestamp } from '../dateTime'

export function formatTimestamp(value?: Date | string): string {
  return formatReadableTimestamp(value) ?? 'Never'
}
