import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBenchmark, createBenchmark, updateBenchmark } from '../../services/benchmarkService';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';

export function BenchmarkFormPage() {
  const { environmentId, benchmarkId } = useParams<{
    environmentId: string;
    benchmarkId: string;
  }>();
  const navigate = useNavigate();
  const isEdit = Boolean(benchmarkId) && benchmarkId !== 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [k6Instructions, setK6Instructions] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !environmentId || !benchmarkId) return;
    setLoading(true);
    getBenchmark(environmentId, benchmarkId)
      .then((bm) => {
        setName(bm.name);
        setDescription(bm.description ?? '');
        setK6Instructions(bm.k6Instructions ?? '');
      })
      .catch(() => setError('Failed to load benchmark.'))
      .finally(() => setLoading(false));
  }, [isEdit, environmentId, benchmarkId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!environmentId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        description: description || undefined,
        k6Instructions: k6Instructions || undefined,
      };
      if (isEdit && benchmarkId) {
        await updateBenchmark(environmentId, benchmarkId, payload);
        navigate(`/environments/${environmentId}/benchmarks/${benchmarkId}`, {
          replace: true,
        });
      } else {
        const created = await createBenchmark(environmentId, payload);
        navigate(
          `/environments/${environmentId}/benchmarks/${created.id}`,
          { replace: true },
        );
      }
    } catch {
      setError(
        isEdit ? 'Failed to update benchmark.' : 'Failed to create benchmark.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Loading benchmark…" />;
  if (error && isEdit && !name) return <ErrorState message={error} />;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {isEdit ? 'Edit Benchmark' : 'New Benchmark'}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6"
      >
        <div>
          <label
            htmlFor="bm-name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="bm-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Homepage load test"
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="bm-desc"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="bm-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label
            htmlFor="bm-k6"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            K6 Script
          </label>
          <textarea
            id="bm-k6"
            rows={16}
            value={k6Instructions}
            onChange={(e) => setK6Instructions(e.target.value)}
            placeholder={`import http from 'k6/http';\nimport { sleep } from 'k6';\n\nexport default function () {\n  http.get('https://example.com');\n  sleep(1);\n}`}
            spellCheck={false}
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            The K6 JavaScript script that will be executed by the agent.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Benchmark'}
          </button>
        </div>
      </form>
    </div>
  );
}
