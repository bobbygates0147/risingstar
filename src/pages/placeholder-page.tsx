type PlaceholderPageProps = {
  description: string
  title: string
}

export function PlaceholderPage({
  description,
  title,
}: PlaceholderPageProps) {
  return (
    <section
      className="surface-glow rounded-[32px] p-8 sm:p-10"
      style={{ backgroundImage: 'var(--gradient-hero-placeholder)' }}
    >
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-tertiary)]">
          Coming next
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </section>
  )
}
