import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import type { MessageDTO } from '../../generated/openapi/models';
import { MessageDTOMessageTypeEnum } from '../../generated/openapi/models';
import { getBenchmarkActionsApi } from '../../lib/apiClient';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

const messageTypeStyle: Record<string, string> = {
  [MessageDTOMessageTypeEnum.PendingStart]:
    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  [MessageDTOMessageTypeEnum.PendingStop]:
    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

const messageTypeLabel: Record<string, string> = {
  [MessageDTOMessageTypeEnum.PendingStart]: 'PENDING START',
  [MessageDTOMessageTypeEnum.PendingStop]: 'PENDING STOP',
};

function MessageRow({ msg, environmentId }: { msg: MessageDTO; environmentId: string }) {
  const style =
    msg.messageType ? (messageTypeStyle[msg.messageType] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300') : '';
  const label =
    msg.messageType ? (messageTypeLabel[msg.messageType] ?? msg.messageType) : 'UNKNOWN';

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${style}`}>
        {label}
      </span>
      <div className="flex-1 min-w-0 text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
        {msg.benchmarkId && (
          <p>
            Benchmark:{' '}
            <Link
              to={`/environments/${environmentId}/benchmarks/${msg.benchmarkId}`}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono text-xs"
            >
              {msg.benchmarkId}
            </Link>
          </p>
        )}
        {msg.runId && (
          <p>
            Run:{' '}
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {msg.runId}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export function EnvironmentMessagesPage() {
  const { environmentId } = useParams<{ environmentId: string }>();
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!environmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBenchmarkActionsApi().listMessages({ environmentId });
      setMessages(data);
    } catch {
      setError('Failed to load messages.');
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
          Agent Messages
        </h2>
        <button
          onClick={load}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading && messages.length === 0 && (
        <LoadingState message="Loading messages…" />
      )}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && messages.length === 0 && (
        <EmptyState
          icon="📭"
          title="No messages"
          description="Agent messages and status updates will appear here."
        />
      )}
      {messages.length > 0 && (
        <div className="flex flex-col gap-2">
          {messages.map((msg, i) => (
            <MessageRow key={i} msg={msg} environmentId={environmentId!} />
          ))}
        </div>
      )}
    </div>
  );
}
