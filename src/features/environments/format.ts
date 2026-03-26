export function formatTimestamp(value?: Date): string {
  if (!value) {
    return 'Never'
  }

  return new Date(value).toLocaleString()
}
