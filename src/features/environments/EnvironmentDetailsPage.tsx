import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'
import type { ServiceDTO } from '../../generated/openapi/models/ServiceDTO'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import {
  EnvironmentDetailsError,
  getEnvironmentDetails,
  getEnvironmentServices,
} from './service'

const REFRESH_INTERVAL_MS = 15000

function formatMemory(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return 'n/a'
  }

  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`
  }

  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(0)} MB`
}

function formatTimestamp(value?: Date): string {
  if (!value) {
    return 'Never'
  }

  return new Date(value).toLocaleString()
}

export function EnvironmentDetailsPage() {
  const { environmentId = '' } = useParams<{ environmentId: string }>()
  const [environment, setEnvironment] = useState<EnvironmentDTO | null>(null)
  const [services, setServices] = useState<Array<ServiceDTO>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!environmentId.trim()) {
      setError('Environment id is missing.')
      setNotFound(true)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setNotFound(false)

    try {
      const [details, nextServices] = await Promise.all([
        getEnvironmentDetails(environmentId),
        getEnvironmentServices(environmentId),
      ])

      setEnvironment(details)
      setServices(nextServices)
    } catch (nextError: unknown) {
      if (nextError instanceof EnvironmentDetailsError) {
        setError(nextError.message)
        setNotFound(nextError.notFound)
      } else {
        setError('Unable to load environment details right now.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [environmentId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load()
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(timer)
    }
  }, [load])

  const sortedServices = useMemo(
    () =>
      [...services].sort((a, b) =>
        (a.serviceName ?? '').localeCompare(b.serviceName ?? ''),
      ),
    [services],
  )

  if (notFound) {
    return (
      <article className="shell-page">
        <h1>Environment not found</h1>
        <p className="auth-text">
          We could not find an environment with id <code>{environmentId}</code>.
        </p>
        <Link className="auth-button environment-inline-action" to="/environments">
          Back to environments
        </Link>
      </article>
    )
  }

  return (
    <article className="shell-page">
      <div className="environment-page-header">
        <div>
          <h1>{environment?.name ?? 'Environment details'}</h1>
          <p className="auth-text">
            Service overview refreshes automatically every 15 seconds.
          </p>
        </div>
        <Link className="shell-alert-dismiss" to="/environments">
          Back
        </Link>
      </div>

      <AsyncStateView
        isLoading={isLoading}
        error={error}
        isEmpty={false}
        onRetry={load}
        loadingTitle="Loading environment details"
      >
        <section className="environment-detail-grid">
          <div>
            <p className="shell-context-label">Type</p>
            <p className="shell-context-value">{environment?.type ?? 'n/a'}</p>
          </div>
          <div>
            <p className="shell-context-label">Agent last seen</p>
            <p className="shell-context-value">
              {formatTimestamp(environment?.agentLastSeenAt)}
            </p>
          </div>
          <div>
            <p className="shell-context-label">Created</p>
            <p className="shell-context-value">
              {formatTimestamp(environment?.createdAt)}
            </p>
          </div>
        </section>

        <section className="environment-services-section">
          <h2>Registered services</h2>
          <AsyncStateView
            isLoading={false}
            error={null}
            isEmpty={sortedServices.length === 0}
            emptyTitle="No services registered"
            emptyDescription="No services have reported into this environment yet."
          >
            <div className="environment-services-table-wrap">
              <table className="environment-services-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Image</th>
                    <th>CPU limit</th>
                    <th>Memory limit</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedServices.map((service, index) => (
                    <tr key={service.id ?? service.serviceName ?? `service-${index}`}>
                      <td>{service.serviceName ?? 'Unnamed service'}</td>
                      <td>{service.imageName ?? service.imageSha ?? 'n/a'}</td>
                      <td>{service.cpuLimit ?? 'n/a'}</td>
                      <td>{formatMemory(service.memoryLimitBytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AsyncStateView>
        </section>
      </AsyncStateView>
    </article>
  )
}

