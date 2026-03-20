import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  getBenchmarkRun,
  getBenchmarkRunRawData,
  stopBenchmarkRun,
  isRunActive,
} from '../../services/benchmarkService';
import type { BenchmarkRunDerivedDTO, RawK6DataPointDTO } from '../../generated/openapi/models';
import { BenchmarkRunDTOStatusEnum } from '../../generated/openapi/models';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';

function useIsDark() {
  const [dark, setDark] = useState(
    document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

function buildResponseTimeChart(
  dataPoints: RawK6DataPointDTO[],
  dark: boolean,
): EChartsOption {
  const times = dataPoints.map((d) => d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : '');
  const responseTimes = dataPoints.map((d) => d.httpResponseTimeMs ?? null);
  const waitingTimes = dataPoints.map((d) => d.httpWaitingMs ?? null);
  const textColor = dark ? '#94a3b8' : '#64748b';
  const gridColor = dark ? '#334155' : '#e2e8f0';

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['Response Time (ms)', 'Waiting (TTFB) (ms)'], textStyle: { color: textColor } },
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: textColor, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: 'ms',
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: gridColor } },
    },
    series: [
      {
        name: 'Response Time (ms)',
        type: 'line',
        data: responseTimes,
        smooth: true,
        itemStyle: { color: '#6366f1' },
        lineStyle: { width: 2 },
      },
      {
        name: 'Waiting (TTFB) (ms)',
        type: 'line',
        data: waitingTimes,
        smooth: true,
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 2 },
      },
    ],
  };
}

function buildVusChart(dataPoints: RawK6DataPointDTO[], dark: boolean): EChartsOption {
  const times = dataPoints.map((d) => d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : '');
  const vus = dataPoints.map((d) => d.vus ?? null);
  const textColor = dark ? '#94a3b8' : '#64748b';
  const gridColor = dark ? '#334155' : '#e2e8f0';

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: textColor, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: 'VUs',
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: gridColor } },
    },
    series: [
      {
        name: 'Virtual Users',
        type: 'line',
        data: vus,
        smooth: true,
        itemStyle: { color: '#10b981' },
        areaStyle: { opacity: 0.15 },
      },
    ],
  };
}

const statusBadge: Record<string, string> = {
  [BenchmarkRunDTOStatusEnum.PendingStart]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  [BenchmarkRunDTOStatusEnum.Started]:      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  [BenchmarkRunDTOStatusEnum.PendingStop]:  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  [BenchmarkRunDTOStatusEnum.Stopped]:      'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  [BenchmarkRunDTOStatusEnum.Finished]:     'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  [BenchmarkRunDTOStatusEnum.Failed]:       'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export function RunMonitorPage() {
  const { environmentId, benchmarkId, runId } = useParams<{
    environmentId: string;
    benchmarkId: string;
    runId: string;
  }>();
  const dark = useIsDark();

  const [derived, setDerived] = useState<BenchmarkRunDerivedDTO | null>(null);
  const [k6Points, setK6Points] = useState<RawK6DataPointDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!environmentId || !benchmarkId || !runId) return;
    try {
      const [derivedData, rawData] = await Promise.all([
        getBenchmarkRun(environmentId, benchmarkId, runId),
        getBenchmarkRunRawData(environmentId, benchmarkId, runId).catch(() => null),
      ]);
      setDerived(derivedData);
      if (rawData?.timeSeries?.k6?.dataPoints) {
        setK6Points(rawData.timeSeries.k6.dataPoints);
      }
      setError(null);
    } catch {
      setError('Failed to load run data.');
    } finally {
      setLoading(false);
    }
  }, [environmentId, benchmarkId, runId]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-poll while run is active
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (derived?.run && isRunActive(derived.run.status)) {
      intervalRef.current = window.setInterval(load, 5_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [derived?.run?.status, load]);

  async function handleStop() {
    if (!environmentId || !benchmarkId || !runId) return;
    setStopping(true);
    try {
      await stopBenchmarkRun(environmentId, benchmarkId, runId);
      await load();
    } catch {
      setError('Failed to stop run.');
    } finally {
      setStopping(false);
    }
  }

  if (loading && !derived) return <LoadingState message="Loading run…" />;
  if (error && !derived) return <ErrorState message={error} onRetry={load} />;
  if (!derived) return null;

  const run = derived.run;
  const active = run ? isRunActive(run.status) : false;
  const hasChartData = k6Points.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Run Monitor
            </h1>
            {run?.status && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[run.status] ?? ''}`}>
                {run.status}
                {active && (
                  <span className="ml-1 inline-block h-2 w-2 rounded-full bg-current animate-pulse" />
                )}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Run ID: {runId}
          </p>
          {run?.startedAt && (
            <p className="text-xs text-slate-400 mt-0.5">
              Started: {new Date(run.startedAt).toLocaleString()}
              {run.finishedAt && ` · Finished: ${new Date(run.finishedAt).toLocaleString()}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {active && (
            <button
              onClick={handleStop}
              disabled={stopping || run?.status === BenchmarkRunDTOStatusEnum.PendingStop}
              className="px-4 py-2 text-sm font-medium bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-md transition-colors"
            >
              {stopping ? 'Stopping…' : '⏹ Stop'}
            </button>
          )}
          <Link
            to={`/environments/${environmentId}/benchmarks/${benchmarkId}/runs/${runId}/results`}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          >
            View Results →
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Live charts */}
      {hasChartData ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Response Time & TTFB
            </h3>
            <ReactECharts
              option={buildResponseTimeChart(k6Points, dark)}
              style={{ height: 260 }}
              notMerge
            />
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Virtual Users
            </h3>
            <ReactECharts
              option={buildVusChart(k6Points, dark)}
              style={{ height: 260 }}
              notMerge
            />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          {active
            ? 'Waiting for metrics data… refreshing every 5 s'
            : 'No time-series data available for this run.'}
        </div>
      )}

      {/* VUS summary */}
      {derived.vus && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Virtual Users Summary
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Min', value: derived.vus.min },
              { label: 'Avg', value: derived.vus.avg },
              { label: 'Max', value: derived.vus.max },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {value ?? '—'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HTTP summaries */}
      {derived.http && derived.http.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            HTTP Summaries
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-2 pr-4">Request Group</th>
                  <th className="text-right py-2 px-2">Total Req.</th>
                  <th className="text-right py-2 px-2">Req/s</th>
                  <th className="text-right py-2 px-2">Err %</th>
                  <th className="text-right py-2 px-2">Avg (ms)</th>
                  <th className="text-right py-2 px-2">P90 (ms)</th>
                  <th className="text-right py-2 pl-2">P95 (ms)</th>
                </tr>
              </thead>
              <tbody>
                {derived.http.map((h, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <td className="py-2 pr-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {h.requestGroup ?? h.url ?? '—'}
                    </td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">
                      {h.totalRequests?.toLocaleString() ?? '—'}
                    </td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">
                      {h.requestsPerSecond != null ? h.requestsPerSecond.toFixed(1) : '—'}
                    </td>
                    <td className={`text-right py-2 px-2 font-medium ${(h.errorRate ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {h.errorRate != null ? `${(h.errorRate * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">
                      {h.duration?.avg?.toFixed(0) ?? '—'}
                    </td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">
                      {h.duration?.percentiles?.['p90']?.toFixed(0) ?? '—'}
                    </td>
                    <td className="text-right py-2 pl-2 text-slate-600 dark:text-slate-400">
                      {h.duration?.percentiles?.['p95']?.toFixed(0) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
