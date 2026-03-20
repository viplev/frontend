import { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink, Outlet } from 'react-router-dom';
import type { EnvironmentDTO } from '../../generated/openapi/models';
import { getEnvironmentApi } from '../../lib/apiClient';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
    isActive
      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
  ].join(' ');

export function EnvironmentDetailPage() {
  const { environmentId } = useParams<{ environmentId: string }>();
  const [env, setEnv] = useState<EnvironmentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!environmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEnvironmentApi().getEnvironment({ environmentId });
      setEnv(data);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        setError('Environment not found.');
      } else {
        setError('Failed to load environment.');
      }
    } finally {
      setLoading(false);
    }
  }, [environmentId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && !env) return <LoadingState message="Loading environment…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!env) return null;

  const base = `/environments/${environmentId}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {env.name}
            </h1>
            {env.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {env.description}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
            {env.type}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          {env.agentLastSeenAt && (
            <span>
              Agent last seen:{' '}
              {new Date(env.agentLastSeenAt).toLocaleString()}
            </span>
          )}
          {env.createdAt && (
            <span>Created: {new Date(env.createdAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 flex gap-0">
        <NavLink to={`${base}/benchmarks`} className={tabClass}>
          Benchmarks
        </NavLink>
        <NavLink to={`${base}/runs`} className={tabClass}>
          Run History
        </NavLink>
        <NavLink to={`${base}/services`} className={tabClass}>
          Services
        </NavLink>
        <NavLink to={`${base}/messages`} className={tabClass}>
          Messages
        </NavLink>
      </div>

      {/* Nested route content */}
      <Outlet context={{ env, reload: load }} />
    </div>
  );
}
