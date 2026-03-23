import { AsyncStateView } from '../ui/async-state/AsyncState'

interface ShellPlaceholderPageProps {
  title: string
  description: string
}

export function ShellPlaceholderPage({
  title,
  description,
}: ShellPlaceholderPageProps) {
  return (
    <article className="shell-page">
      <h1>{title}</h1>
      <AsyncStateView
        isLoading={false}
        error={null}
        isEmpty={false}
      >
        <p>{description}</p>
      </AsyncStateView>
    </article>
  )
}

