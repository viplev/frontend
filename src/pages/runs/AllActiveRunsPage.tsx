import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { EnvironmentDTO, EnvironmentRunSummaryDTO } from '../../generated/openapi/models';
import { EnvironmentRunSummaryDTOStatusEnum } from '../../generated/openapi/models';
import { getEnvironmentApi } from '../../lib/apiClient';
import { listEnvironmentRuns, isRunActive } from '../../services/benchmarkService';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

const statusBadge: Record<string, string> = {
  [EnvironmentRunSummaryDTOStatusEnum.PendingStart]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  [EnvironmentRunSummaryDTOStatusEnum.Started]:      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  [EnvironmentRunSummaryDTOStatusEnum.PendingStop]:  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

interface ActiveRunRow {
  env: EnvironmentDTO;
  run: EnvironmentRunSummaryDTO;
}

export function AllActiveRunsPage() {
  const [rows, setRows] = useState<ActiveRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const environments = await getEnvironmentApi().listEnvironments();
      const activeRows: ActiveRunRow[] = [];

      await Promise.all(
        environments.map(async (env) => {
          if (!env.id) return;
          try {
            const data = await listEnvironmentRuns(env.id);
            const active = (data?.runs ?? []).filter((r) =>
              isRunActive(r.status),
            );
            active.forEach((run) => activeRows.push({ env, run }));
          } catch {
            // ignore per-environment errors
          }
        }),
      );

      setRows(activeRows);
    } catch {
      setError('Failed to load environments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            All Active Runs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Auto-refreshes every 10 s
          </p>
        </div>
        <button
          onClick={load}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Refresh now
        </button>
      </div>

      {loading && rows.length === 0 && (
        <LoadingState message="Loading active runs…" />
      )}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState
          icon="✅"
          title="No active runs"
          description="There are no benchmarks running across any environment right now."
        />
      )}
      {rows.length > 0 && (
        <div className="flex flex-col gap-3">
          {rows.map(({ env, run }) => (
            <div
              key={`${run.benchmarkId}-${run.runId}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 flex-wrap"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/environments/${env.id}`}
                    className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {env.name}
                  </Link>
                  {run.status && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[run.status] ?? ''}`}>
                      {run.status}
                      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Benchmark: {run.benchmarkId ?? '—'} · Run: {run.runId ?? '—'}
                </div>
                {run.startedAt && (
                  <div className="mt-0.5 text-xs text-slate-400">
                    Started: {new Date(run.startedAt).toLocaleString()}
                  </div>
                )}
              </div>
              {run.benchmarkId && run.runId && env.id && (
                <Link
                  to={`/environments/${env.id}/benchmarks/${run.benchmarkId}/runs/${run.runId}`}
                  className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                >
                  Monitor →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
