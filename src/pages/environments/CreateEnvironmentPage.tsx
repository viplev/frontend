import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvironmentDTOTypeEnum } from '../../generated/openapi/models';
import { getEnvironmentApi } from '../../lib/apiClient';

export function CreateEnvironmentPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EnvironmentDTOTypeEnum>(EnvironmentDTOTypeEnum.Docker);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentCommand, setAgentCommand] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await getEnvironmentApi().createEnvironment({
        environmentDTO: { name, description: description || undefined, type },
      });
      setCreatedId(result.id ?? null);
      setAgentCommand(result.agentCommand ?? null);
    } catch {
      setError('Failed to create environment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Success state – show agent install command
  if (agentCommand !== null) {
    return (
      <div className="max-w-xl">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-1">
            Environment created!
          </h2>
          <p className="text-sm text-green-700 dark:text-green-400 mb-4">
            Run the following command on your target system to install the agent:
          </p>
          <pre className="bg-slate-900 text-green-400 text-xs rounded-md p-4 overflow-x-auto whitespace-pre-wrap break-all">
            {agentCommand}
          </pre>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(agentCommand);
              }}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
            >
              Copy command
            </button>
            <button
              onClick={() =>
                navigate(
                  createdId ? `/environments/${createdId}` : '/environments',
                  { replace: true }
                )
              }
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              Go to environment →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Create Environment
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Environments represent the containerized systems you want to benchmark.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production Cluster"
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of this environment"
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Container Platform <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as EnvironmentDTOTypeEnum)}
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={EnvironmentDTOTypeEnum.Docker}>Docker</option>
            <option value={EnvironmentDTOTypeEnum.Kubernetes}>Kubernetes</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/environments')}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            {loading ? 'Creating…' : 'Create Environment'}
          </button>
        </div>
      </form>
    </div>
  );
}
