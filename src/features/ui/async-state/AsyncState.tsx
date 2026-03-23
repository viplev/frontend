import type { ReactNode } from 'react'

interface LoadingStateProps {
  title?: string
  description?: string
}

interface EmptyStateProps {
  title: string
  description: string
}

interface ErrorStateProps {
  title?: string
  message: string
  retryLabel?: string
  onRetry: () => void
}

interface AsyncStateViewProps {
  isLoading: boolean
  error: string | null
  isEmpty: boolean
  onRetry: () => void
  emptyTitle: string
  emptyDescription: string
  loadingTitle?: string
  loadingDescription?: string
  children: ReactNode
}

export function LoadingState({
  title = 'Loading data',
  description = 'Please wait while we fetch the latest information.',
}: LoadingStateProps) {
  return (
    <section className="async-state async-state-loading" role="status">
      <div className="async-spinner" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  )
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="async-state async-state-empty">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  retryLabel = 'Retry',
  onRetry,
}: ErrorStateProps) {
  return (
    <section className="async-state async-state-error" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      <button type="button" className="auth-button async-retry" onClick={onRetry}>
        {retryLabel}
      </button>
    </section>
  )
}

export function AsyncStateView({
  isLoading,
  error,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyDescription,
  loadingTitle,
  loadingDescription,
  children,
}: AsyncStateViewProps) {
  if (isLoading) {
    return (
      <LoadingState title={loadingTitle} description={loadingDescription} />
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return <>{children}</>
}
