import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { BenchmarkDTO, BenchmarkRunDTO } from '../../generated/openapi/models';
import { BenchmarkRunDTOStatusEnum } from '../../generated/openapi/models';
import {
  listBenchmarks,
  listBenchmarkRuns,
  startBenchmark,
  stopBenchmarkRun,
  isRunActive,
} from '../../services/benchmarkService';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

const statusColors: Record<string, string> = {
  [BenchmarkRunDTOStatusEnum.PendingStart]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  [BenchmarkRunDTOStatusEnum.Started]:      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  [BenchmarkRunDTOStatusEnum.PendingStop]:  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  [BenchmarkRunDTOStatusEnum.Stopped]:      'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  [BenchmarkRunDTOStatusEnum.Finished]:     'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  [BenchmarkRunDTOStatusEnum.Failed]:       'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

interface BenchmarkCardProps {
  benchmark: BenchmarkDTO;
  environmentId: string;
  latestRun: BenchmarkRunDTO | undefined;
  onStart: (benchmarkId: string) => Promise<void>;
  onStop: (benchmarkId: string, runId: string) => Promise<void>;
}

function BenchmarkCard({ benchmark, environmentId, latestRun, onStart, onStop }: BenchmarkCardProps) {
  const [acting, setActing] = useState(false);
  const active = latestRun ? isRunActive(latestRun.status) : false;

  async function handleStart() {
    if (!benchmark.id) return;
    setActing(true);
    try {
      await onStart(benchmark.id);
    } finally {
      setActing(false);
    }
  }

  async function handleStop() {
    if (!benchmark.id || !latestRun?.id) return;
    setActing(true);
    try {
      await onStop(benchmark.id, latestRun.id);
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            to={`/environments/${environmentId}/benchmarks/${benchmark.id}`}
            className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {benchmark.name}
          </Link>
          {benchmark.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              {benchmark.description}
            </p>
          )}
        </div>
        {latestRun?.status && (
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[latestRun.status] ?? ''}`}>
            {latestRun.status}
          </span>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Link
          to={`/environments/${environmentId}/benchmarks/${benchmark.id}/edit`}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
        >
          Edit
        </Link>
        {active ? (
          <button
            onClick={handleStop}
            disabled={acting || latestRun?.status === BenchmarkRunDTOStatusEnum.PendingStop}
            className="px-3 py-1.5 text-xs font-medium bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            {acting ? 'Stopping…' : 'Stop Run'}
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={acting}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            {acting ? 'Starting…' : '▶ Run'}
          </button>
        )}
        {latestRun?.id && (
          <Link
            to={`/environments/${environmentId}/benchmarks/${benchmark.id}/runs/${latestRun.id}`}
            className="ml-auto px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Latest run →
          </Link>
        )}
      </div>
    </div>
  );
}

export function BenchmarksPage() {
  const { environmentId } = useParams<{ environmentId: string }>();
  const [benchmarks, setBenchmarks] = useState<BenchmarkDTO[]>([]);
  const [latestRuns, setLatestRuns] = useState<Record<string, BenchmarkRunDTO>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!environmentId) return;
    setLoading(true);
    setError(null);
    try {
      const bms = await listBenchmarks(environmentId);
      setBenchmarks(bms);
      // Load latest run for each benchmark
      const runMap: Record<string, BenchmarkRunDTO> = {};
      await Promise.all(
        bms.map(async (bm) => {
          if (!bm.id) return;
          try {
            const runs = await listBenchmarkRuns(environmentId, bm.id);
            if (runs.length > 0) {
              runMap[bm.id] = runs[runs.length - 1];
            }
          } catch {
            // ignore per-benchmark errors for run status
          }
        }),
      );
      setLatestRuns(runMap);
    } catch {
      setError('Failed to load benchmarks.');
    } finally {
      setLoading(false);
    }
  }, [environmentId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleStart(benchmarkId: string) {
    if (!environmentId) return;
    setActionError(null);
    try {
      await startBenchmark(environmentId, benchmarkId);
      await load();
    } catch {
      setActionError('Failed to start benchmark. Is another run already active?');
    }
  }

  async function handleStop(benchmarkId: string, runId: string) {
    if (!environmentId) return;
    setActionError(null);
    try {
      await stopBenchmarkRun(environmentId, benchmarkId, runId);
      await load();
    } catch {
      setActionError('Failed to stop run.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Benchmarks
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-400">Auto-refreshes every 10 s</p>
          <Link
            to={`/environments/${environmentId}/benchmarks/new`}
            className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          >
            + New Benchmark
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
          {actionError}
        </div>
      )}

      {loading && benchmarks.length === 0 && (
        <LoadingState message="Loading benchmarks…" />
      )}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && benchmarks.length === 0 && (
        <EmptyState
          icon="🏃"
          title="No benchmarks yet"
          description="Create your first benchmark to start running load tests."
          action={
            <Link
              to={`/environments/${environmentId}/benchmarks/new`}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              Create Benchmark
            </Link>
          }
        />
      )}
      {benchmarks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {benchmarks.map((bm) => (
            <BenchmarkCard
              key={bm.id}
              benchmark={bm}
              environmentId={environmentId!}
              latestRun={bm.id ? latestRuns[bm.id] : undefined}
              onStart={handleStart}
              onStop={handleStop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
