import { Bot, ChevronRight, Globe2, KeyRound, LogOut, ShieldCheck, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardSummary } from '../data/platform-data'
import { formatUsd } from '../lib/format'

const settings = [
  { id: 'password', label: 'Change Password', detail: 'Update your sign-in credentials', icon: KeyRound },
  { id: 'payments', label: 'Payment Methods', detail: 'Manage payout and deposit channels', icon: ShieldCheck },
  { id: 'notifications', label: 'Notification Settings', detail: 'Configure task and wallet alerts', icon: Globe2 },
]

export function ProfilePage() {
  return (
    <div className="space-y-6" id="settings">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--glow)] to-[var(--blue)] text-xl font-semibold text-white">
              AJ
            </div>
            <div>
              <p className="font-display text-2xl font-semibold text-[var(--text-primary)]">Alex Johnson</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">alex.johnson@email.com</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Member since Dec 2023</p>
            </div>
          </div>

          <div className="mt-6 rounded-[26px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Current tier</p>
                <p className="mt-2 inline-flex items-center gap-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  <Star className="h-5 w-5 text-[var(--warning)]" />
                  {dashboardSummary.currentTier}
                </p>
              </div>
              <span className="rounded-full bg-[rgba(124,58,237,0.16)] px-3 py-1 text-xs font-semibold text-[var(--glow)]">ACTIVE</span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--surface-track)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] via-[var(--glow)] to-[var(--blue)]"
                style={{ width: `${dashboardSummary.tierProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {dashboardSummary.tierProgress}% to {dashboardSummary.nextTier}
            </p>
          </div>
        </article>

        <article className="surface-glow overflow-hidden rounded-[30px] p-6" style={{ backgroundImage: 'var(--gradient-hero-accent)' }}>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Account stats</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Total earnings</p>
              <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">{formatUsd(247_800)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Tasks completed</p>
              <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">1,432</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Days active</p>
              <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">87</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Settings</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">Account controls</h3>
          </div>
          <Link
            to="/ai-bot"
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[rgba(124,58,237,0.14)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[rgba(124,58,237,0.22)]"
          >
            <Bot className="h-4 w-4" />
            AI Bot
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {settings.map((setting) => {
            const Icon = setting.icon

            return (
              <button
                key={setting.id}
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-panel)] text-[var(--glow)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-medium text-[var(--text-primary)]">{setting.label}</span>
                    <span className="block text-xs text-[var(--text-tertiary)]">{setting.detail}</span>
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link
            to="/artist"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
          >
            Artist Dashboard
          </Link>
          <Link
            to="/admin"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
          >
            Admin Panel
          </Link>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/15"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </section>
    </div>
  )
}
