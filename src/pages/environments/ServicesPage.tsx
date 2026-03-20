import { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import type { ServiceDTO, EnvironmentDTO } from '../../generated/openapi/models';
import { getEnvironmentApi } from '../../lib/apiClient';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

interface OutletCtx {
  env: EnvironmentDTO;
}

function formatBytes(bytes?: number) {
  if (bytes == null) return '—';
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function ServiceRow({ service }: { service: ServiceDTO }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {service.serviceName ?? '—'}
        </p>
        {service.imageName && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {service.imageName}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
        {service.cpuLimit != null && (
          <span>CPU limit: {service.cpuLimit}</span>
        )}
        {service.memoryLimitBytes != null && (
          <span>Mem limit: {formatBytes(service.memoryLimitBytes)}</span>
        )}
      </div>
    </div>
  );
}

export function ServicesPage() {
  const { environmentId } = useParams<{ environmentId: string }>();
  const { env } = useOutletContext<OutletCtx>();
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!environmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEnvironmentApi().listServices({ environmentId });
      setServices(data);
    } catch {
      setError('Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, [environmentId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Services
        </h2>
        <p className="text-xs text-slate-400">Auto-refreshes every 15 s</p>
      </div>

      {loading && services.length === 0 && (
        <LoadingState message="Loading services…" />
      )}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && services.length === 0 && (
        <EmptyState
          icon="📦"
          title="No services registered"
          description={`Start the agent for "${env.name}" to see services appear here.`}
        />
      )}
      {services.length > 0 && (
        <div className="flex flex-col gap-2">
          {services.map((s) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
