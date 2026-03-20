interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="text-red-400 text-5xl">⚠</div>
      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
