import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { getBenchmarkRun } from '../../services/benchmarkService';
import type { BenchmarkRunDerivedDTO, DerivedHttpSummaryDTO } from '../../generated/openapi/models';
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

function buildPercentileChart(http: DerivedHttpSummaryDTO[], dark: boolean): EChartsOption {
  const groups = http.map((h) => h.requestGroup ?? h.url ?? '?');
  const p50 = http.map((h) => h.duration?.median ?? null);
  const p90 = http.map((h) => h.duration?.percentiles?.['p90'] ?? null);
  const p95 = http.map((h) => h.duration?.percentiles?.['p95'] ?? null);
  const textColor = dark ? '#94a3b8' : '#64748b';
  const gridColor = dark ? '#334155' : '#e2e8f0';

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['p50', 'p90', 'p95'], textStyle: { color: textColor } },
    grid: { left: 50, right: 20, top: 40, bottom: 60 },
    xAxis: {
      type: 'category',
      data: groups,
      axisLabel: { color: textColor, rotate: 20, interval: 0 },
      axisLine: { lineStyle: { color: gridColor } },
    },
    yAxis: {
      type: 'value',
      name: 'ms',
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: gridColor } },
    },
    series: [
      { name: 'p50', type: 'bar', data: p50, itemStyle: { color: '#6366f1' } },
      { name: 'p90', type: 'bar', data: p90, itemStyle: { color: '#f59e0b' } },
      { name: 'p95', type: 'bar', data: p95, itemStyle: { color: '#ef4444' } },
    ],
  };
}

function buildErrorRateChart(http: DerivedHttpSummaryDTO[], dark: boolean): EChartsOption {
  const groups = http.map((h) => h.requestGroup ?? h.url ?? '?');
  const rates = http.map((h) =>
    h.errorRate != null ? +(h.errorRate * 100).toFixed(2) : null,
  );
  const textColor = dark ? '#94a3b8' : '#64748b';
  const gridColor = dark ? '#334155' : '#e2e8f0';

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: groups,
      axisLabel: { color: textColor, rotate: 20, interval: 0 },
      axisLine: { lineStyle: { color: gridColor } },
    },
    yAxis: {
      type: 'value',
      name: '%',
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: gridColor } },
    },
    series: [
      {
        name: 'Error Rate',
        type: 'bar',
        data: rates.map((v) => ({
          value: v,
          itemStyle: {
            color: v != null && v > 5 ? '#ef4444' : '#10b981',
          },
        })),
      },
    ],
  };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export function RunResultsPage() {
  const { environmentId, benchmarkId, runId } = useParams<{
    environmentId: string;
    benchmarkId: string;
    runId: string;
  }>();
  const dark = useIsDark();

  const [derived, setDerived] = useState<BenchmarkRunDerivedDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!environmentId || !benchmarkId || !runId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBenchmarkRun(environmentId, benchmarkId, runId, 'p50,p90,p95');
      setDerived(data);
    } catch {
      setError('Failed to load run results.');
    } finally {
      setLoading(false);
    }
  }, [environmentId, benchmarkId, runId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading results…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!derived) return null;

  const http = derived.http ?? [];
  const totals = http.reduce(
    (acc, h) => {
      acc.requests += h.totalRequests ?? 0;
      acc.rps += h.requestsPerSecond ?? 0;
      return acc;
    },
    { requests: 0, rps: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          to={`/environments/${environmentId}/benchmarks/${benchmarkId}/runs/${runId}`}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Back to Monitor
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white ml-4">
          Run Results
        </h1>
        <span className="text-xs font-mono text-slate-400">{runId}</span>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Requests" value={totals.requests.toLocaleString()} />
        <StatCard label="Avg Req/s" value={totals.rps.toFixed(1)} />
        {derived.vus && (
          <>
            <StatCard label="VUs (avg)" value={derived.vus.avg?.toFixed(0) ?? '—'} />
            <StatCard label="VUs (max)" value={derived.vus.max ?? '—'} />
          </>
        )}
      </div>

      {/* Charts */}
      {http.length > 0 && (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Response Time Percentiles by Request Group
            </h3>
            <ReactECharts
              option={buildPercentileChart(http, dark)}
              style={{ height: 300 }}
              notMerge
            />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Error Rate by Request Group
            </h3>
            <ReactECharts
              option={buildErrorRateChart(http, dark)}
              style={{ height: 260 }}
              notMerge
            />
          </div>

          {/* Detailed table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 overflow-x-auto">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Detailed HTTP Metrics
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-2 pr-4">Group / URL</th>
                  <th className="text-right py-2 px-2">Reqs</th>
                  <th className="text-right py-2 px-2">Req/s</th>
                  <th className="text-right py-2 px-2">Err%</th>
                  <th className="text-right py-2 px-2">Avg</th>
                  <th className="text-right py-2 px-2">Med</th>
                  <th className="text-right py-2 px-2">Min</th>
                  <th className="text-right py-2 px-2">Max</th>
                  <th className="text-right py-2 px-2">p90</th>
                  <th className="text-right py-2 pl-2">p95</th>
                </tr>
              </thead>
              <tbody>
                {http.map((h, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <td className="py-2 pr-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {h.requestGroup ?? h.url ?? '—'}
                    </td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">{h.totalRequests?.toLocaleString() ?? '—'}</td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">{h.requestsPerSecond?.toFixed(1) ?? '—'}</td>
                    <td className={`text-right py-2 px-2 font-medium ${(h.errorRate ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {h.errorRate != null ? `${(h.errorRate * 100).toFixed(2)}%` : '—'}
                    </td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">{h.duration?.avg?.toFixed(0) ?? '—'}</td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">{h.duration?.median?.toFixed(0) ?? '—'}</td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">{h.duration?.min?.toFixed(0) ?? '—'}</td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">{h.duration?.max?.toFixed(0) ?? '—'}</td>
                    <td className="text-right py-2 px-2 text-slate-600 dark:text-slate-400">{h.duration?.percentiles?.['p90']?.toFixed(0) ?? '—'}</td>
                    <td className="text-right py-2 pl-2 text-slate-600 dark:text-slate-400">{h.duration?.percentiles?.['p95']?.toFixed(0) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {http.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          No HTTP metric data available for this run.
        </div>
      )}
    </div>
  );
}
