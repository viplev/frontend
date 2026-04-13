import { useParams } from 'react-router-dom'

export function BenchmarkRunComparisonPage() {
  const {
    environmentId = '',
    benchmarkId = '',
    runIdA = '',
    runIdB = '',
  } = useParams<{
    environmentId: string
    benchmarkId: string
    runIdA: string
    runIdB: string
  }>()

  return (
    <article className="run-comparison-page">
      <h1>Run Comparison</h1>
      <p>
        Comparing runs <strong>{runIdA.slice(0, 8)}</strong> and{' '}
        <strong>{runIdB.slice(0, 8)}</strong> from benchmark{' '}
        <strong>{benchmarkId.slice(0, 8)}</strong> in environment{' '}
        <strong>{environmentId.slice(0, 8)}</strong>.
      </p>
      <p>Full comparison view coming in Phase 2.</p>
    </article>
  )
}
