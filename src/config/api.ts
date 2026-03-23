const DEFAULT_API_BASE_URL = 'http://localhost:8080'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!configured) {
    return DEFAULT_API_BASE_URL
  }

  return trimTrailingSlash(configured)
}

