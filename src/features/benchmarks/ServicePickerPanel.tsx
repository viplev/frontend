import { useCallback, useEffect, useState } from 'react'
import type { ServiceDTO } from '../../generated/openapi/models/ServiceDTO'
import { getEnvironmentServices } from '../environments/service'

const POLL_INTERVAL_MS = 30_000

interface ServicePickerPanelProps {
  environmentId: string
  /** Called when the user clicks a service entry. Parent decides insert vs clipboard. */
  onServiceClick: (serviceName: string) => void
  /** Service name that was most recently copied to clipboard (drives the "Copied!" badge). */
  copiedService: string | null
}

export function ServicePickerPanel({
  environmentId,
  onServiceClick,
  copiedService,
}: ServicePickerPanelProps) {
  const [services, setServices] = useState<ServiceDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCounter, setRetryCounter] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchServices = useCallback(
    async (isActive: { value: boolean }) => {
      try {
        const result = await getEnvironmentServices(environmentId)
        if (!isActive.value) return
        setServices(result.slice().sort((a, b) => a.serviceName.localeCompare(b.serviceName)))
        setError(null)
      } catch {
        if (!isActive.value) return
        setError('Unable to load services right now.')
      } finally {
        if (isActive.value) setLoading(false)
      }
    },
    [environmentId],
  )

  useEffect(() => {
    const isActive = { value: true }
    setLoading(true)
    void fetchServices(isActive)

    const interval = setInterval(() => {
      void fetchServices(isActive)
    }, POLL_INTERVAL_MS)

    return () => {
      isActive.value = false
      clearInterval(interval)
    }
  }, [fetchServices, retryCounter])

  const filteredServices = searchQuery.trim()
    ? services.filter((s) =>
        s.serviceName.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : services

  return (
    <aside className="benchmark-service-picker">
      <div className="benchmark-service-picker-header">
        <span className="benchmark-service-picker-title">Services</span>
        {loading && <span className="benchmark-service-picker-loading">Loading…</span>}
      </div>

      {!error && (
        <div className="benchmark-service-picker-search">
          <input
            type="search"
            className="benchmark-service-picker-search-input"
            placeholder="Filter services…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter services"
          />
        </div>
      )}

      {error ? (
        <div className="benchmark-service-picker-error">
          <p>{error}</p>
          <button
            type="button"
            className="benchmark-service-picker-retry"
            onClick={() => setRetryCounter((c) => c + 1)}
          >
            Retry
          </button>
        </div>
      ) : !loading && services.length === 0 ? (
        <p className="benchmark-service-picker-empty">No services registered.</p>
      ) : !loading && filteredServices.length === 0 ? (
        <p className="benchmark-service-picker-empty">No services match your search.</p>
      ) : (
        <ul className="benchmark-service-picker-list" role="list">
          {filteredServices.map((svc) => (
            <li key={svc.id ?? svc.serviceName}>
              <button
                type="button"
                className="benchmark-service-picker-item"
                onClick={() => onServiceClick(svc.serviceName)}
                title={`Insert "${svc.serviceName}"`}
              >
                <span className="benchmark-service-picker-item-name">{svc.serviceName}</span>
                <span className="benchmark-service-picker-item-image">
                  {svc.imageName ?? svc.imageSha ?? 'Unknown image'}
                </span>
                {copiedService === svc.serviceName && (
                  <span className="benchmark-service-picker-copied" aria-live="polite">
                    Copied!
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
