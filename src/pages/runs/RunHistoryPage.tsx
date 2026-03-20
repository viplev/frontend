import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { EnvironmentRunSummaryDTO } from '../../generated/openapi/models';
import { EnvironmentRunSummaryDTOStatusEnum } from '../../generated/openapi/models';
import { listEnvironmentRuns, isRunActive } from '../../services/benchmarkService';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

const statusBadge: Record<string, string> = {
  [EnvironmentRunSummaryDTOStatusEnum.PendingStart]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  [EnvironmentRunSummaryDTOStatusEnum.Started]:      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  [EnvironmentRunSummaryDTOStatusEnum.PendingStop]:  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  [EnvironmentRunSummaryDTOStatusEnum.Stopped]:      'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  [EnvironmentRunSummaryDTOStatusEnum.Finished]:     'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  [EnvironmentRunSummaryDTOStatusEnum.Failed]:       'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

function formatDuration(start?: Date, end?: Date) {
  if (!start) return '—';
  const from = new Date(start).getTime();
  const to = end ? new Date(end).getTime() : Date.now();
  const s = Math.floor((to - from) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export function RunHistoryPage() {
  const { environmentId } = useParams<{ environmentId: string }>();
  const [runs, setRuns] = useState<EnvironmentRunSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!environmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listEnvironmentRuns(environmentId);
      setRuns(data?.runs ?? []);
    } catch {
      setError('Failed to load run history.');
    } finally {
      setLoading(false);
    }
  }, [environmentId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Run History
        </h2>
        <button
          onClick={load}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading && runs.length === 0 && <LoadingState message="Loading run history…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && runs.length === 0 && (
        <EmptyState
          icon="📋"
          title="No runs yet"
          description="Start a benchmark to see run history here."
        />
      )}
      {runs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 pr-4">Benchmark</th>
                <th className="text-left py-2 px-2">Run ID</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Started</th>
                <th className="text-left py-2 pl-2">Duration</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={`${run.benchmarkId}-${run.runId}`}
                  className="border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="py-2 pr-4 font-mono text-xs text-slate-500 dark:text-slate-400 max-w-[160px] truncate">
                    {run.benchmarkId ?? '—'}
                  </td>
                  <td className="py-2 px-2 font-mono text-xs text-slate-500 dark:text-slate-400 max-w-[160px] truncate">
                    {run.runId ?? '—'}
                  </td>
                  <td className="py-2 px-2">
                    {run.status && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[run.status] ?? ''}`}>
                        {run.status}
                        {isRunActive(run.status) && (
                          <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                        )}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-xs text-slate-500 dark:text-slate-400">
                    {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 pl-2 text-xs text-slate-500 dark:text-slate-400">
                    {formatDuration(run.startedAt, run.finishedAt ?? undefined)}
                  </td>
                  <td className="py-2 text-right">
                    {run.benchmarkId && run.runId && (
                      <Link
                        to={`/environments/${environmentId}/benchmarks/${run.benchmarkId}/runs/${run.runId}`}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
