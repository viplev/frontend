import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { EnvironmentDTO } from '../../generated/openapi/models';
import { getEnvironmentApi } from '../../lib/apiClient';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

function EnvironmentCard({ env }: { env: EnvironmentDTO }) {
  const lastSeen = env.agentLastSeenAt
    ? new Date(env.agentLastSeenAt).toLocaleString()
    : null;

  return (
    <Link
      to={`/environments/${env.id}`}
      className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {env.name}
          </h2>
          {env.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              {env.description}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
          {env.type}
        </span>
      </div>
      {lastSeen && (
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Agent last seen: {lastSeen}
        </p>
      )}
    </Link>
  );
}

export function EnvironmentsPage() {
  const [environments, setEnvironments] = useState<EnvironmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEnvironmentApi().listEnvironments();
      setEnvironments(data);
    } catch {
      setError('Failed to load environments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Environments
        </h1>
        <Link
          to="/environments/new"
          className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
        >
          + New Environment
        </Link>
      </div>

      {loading && <LoadingState message="Loading environments…" />}
      {!loading && error && (
        <ErrorState message={error} onRetry={load} />
      )}
      {!loading && !error && environments.length === 0 && (
        <EmptyState
          icon="🌍"
          title="No environments yet"
          description="Create your first environment to get started with benchmarking."
          action={
            <Link
              to="/environments/new"
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              Create Environment
            </Link>
          }
        />
      )}
      {!loading && !error && environments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {environments.map((env) => (
            <EnvironmentCard key={env.id} env={env} />
          ))}
        </div>
      )}
    </div>
  );
}
