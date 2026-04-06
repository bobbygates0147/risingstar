import { Bot, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react'

const constraints = [
  'Bot requires periodic human confirmation.',
  'Muted or background sessions may invalidate rewards.',
  'Automation is tier-limited and monitored for fraud spikes.',
]

export function AIBotPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="surface-glow overflow-hidden rounded-[30px] p-6" style={{ backgroundImage: 'var(--gradient-hero-accent)' }}>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Automation</p>
          <h2 className="mt-3 inline-flex items-center gap-2 font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
            <Bot className="h-9 w-9 text-[var(--glow)]" />
            AI Bot Assistant
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
            AI bot handles repetitive queue steps while preserving compliance through periodic interaction checkpoints.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" />
              Activate Bot
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              Upgrade plan
            </button>
          </div>
        </article>

        <article className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Session status</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Bot state</p>
              <p className="mt-2 font-display text-2xl font-semibold text-emerald-100">Active</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Daily usage</p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--surface-track)]">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[var(--purple)] to-[var(--blue)]" />
              </div>
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">68% used of today's automation quota</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Compliance</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">Security constraints</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {constraints.map((item) => (
            <div key={item} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <ShieldAlert className="h-4 w-4 text-[var(--warning)]" />
                Check
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            Recommendation
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Keep bot active during peak queue hours (07:00 - 11:00 WAT) for best reward throughput.
          </p>
        </div>
      </section>
    </div>
  )
}
