import { BarChart3, Music2, Rocket, UploadCloud } from 'lucide-react'

export function ArtistDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="surface-glow overflow-hidden rounded-[30px] p-6" style={{ backgroundImage: 'var(--gradient-hero-tasks)' }}>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Artist control room</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
          Upload tracks and launch campaigns
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
          Use this dashboard to publish music, configure promotion budgets, target audience segments, and monitor engagement.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            <UploadCloud className="h-4 w-4 text-[var(--glow)]" />
            Upload music
          </p>

          <div className="mt-4 grid gap-3">
            <input placeholder="Song title" className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
            <input placeholder="Artist name" className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
            <label className="flex h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-center text-sm text-[var(--text-secondary)] hover:border-[var(--border-strong)]">
              Upload audio file + cover art
              <input type="file" className="hidden" />
            </label>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(124,58,237,0.28)] transition hover:brightness-110"
            >
              <Music2 className="h-4 w-4" />
              Submit track
            </button>
          </div>
        </article>

        <article className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            <Rocket className="h-4 w-4 text-[var(--blue)]" />
            Create campaign
          </p>

          <div className="mt-4 grid gap-3">
            <select className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none">
              <option>Choose song</option>
              <option>Moonline Rush</option>
              <option>Gallery Bloom</option>
            </select>
            <input placeholder="Budget (USDT)" className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
            <input placeholder="Target audience" className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
            <input placeholder="Duration (days)" className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[rgba(124,58,237,0.14)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[rgba(124,58,237,0.22)]"
            >
              Launch campaign
            </button>
          </div>
        </article>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          <BarChart3 className="h-4 w-4 text-[var(--warning)]" />
          Analytics
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Total plays</p>
            <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">142.8K</p>
          </div>
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Engagement count</p>
            <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">38.1K</p>
          </div>
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Spend vs result</p>
            <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">$4.1K / 1.2M reach</p>
          </div>
        </div>
      </section>
    </div>
  )
}
