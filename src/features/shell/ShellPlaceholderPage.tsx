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
      <p>{description}</p>
    </article>
  )
}

