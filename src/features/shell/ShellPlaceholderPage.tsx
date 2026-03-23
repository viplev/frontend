import { useEffect, useState } from 'react'
import { AsyncStateView } from '../ui/async-state/AsyncState'

interface ShellPlaceholderPageProps {
  title: string
  description: string
}

export function ShellPlaceholderPage({
  title,
  description,
}: ShellPlaceholderPageProps) {
  const [stage, setStage] = useState<'loading' | 'empty' | 'error' | 'ready'>(
    'loading',
  )

  useEffect(() => {
    if (stage !== 'loading') {
      return
    }

    const timer = window.setTimeout(() => {
      setStage('ready')
    }, 450)

    return () => {
      window.clearTimeout(timer)
    }
  }, [stage])

  const handleRetry = () => {
    setStage('loading')
  }

  const isLoading = stage === 'loading'
  const error = stage === 'error' ? 'Unable to load this view right now.' : null
  const isEmpty = stage === 'empty'

  return (
    <article className="shell-page">
      <h1>{title}</h1>
      <AsyncStateView
        isLoading={isLoading}
        error={error}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        emptyTitle={`No ${title.toLowerCase()} yet`}
        emptyDescription={`Once data is available, ${title.toLowerCase()} will be listed here.`}
        loadingTitle={`Loading ${title.toLowerCase()}`}
      >
        <p>{description}</p>
        <div className="async-demo-actions">
          <button
            type="button"
            className="shell-alert-dismiss"
            onClick={() => setStage('empty')}
          >
            Show empty state
          </button>
          <button
            type="button"
            className="shell-alert-dismiss"
            onClick={() => setStage('error')}
          >
            Show error state
          </button>
          <button
            type="button"
            className="shell-alert-dismiss"
            onClick={handleRetry}
          >
            Show loading state
          </button>
        </div>
      </AsyncStateView>
    </article>
  )
}

