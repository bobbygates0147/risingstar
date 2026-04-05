import {
  ArrowUpRight,
  Bot,
  Clapperboard,
  CircleGauge,
  Clock3,
  Heart,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  activityFeed,
  dashboardSummary,
  rewardTasks,
  type TaskType,
} from '../data/platform-data'
import { formatCompactUsd, formatUsd } from '../lib/format'

const previewTasks = rewardTasks
  .filter((task) => task.status !== 'completed')
  .slice(0, 4)

function getPreviewActionLabel(taskType: TaskType) {
  if (taskType === 'Ads') {
    return 'Watch'
  }

  if (taskType === 'Art') {
    return 'Like'
  }

  return 'Play'
}

function getPreviewActionIcon(taskType: TaskType) {
  if (taskType === 'Ads') {
    return Clapperboard
  }

  if (taskType === 'Art') {
    return Heart
  }

  return Play
}

export function DashboardPage() {
  const dailyProgress = Math.min(
    (dashboardSummary.todayEarnings / dashboardSummary.dailyLimit) * 100,
    100,
  )

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] xl:items-stretch">
        <div
          className="surface-glow h-full overflow-hidden rounded-[30px]"
          style={{ backgroundImage: 'var(--gradient-hero-balance)' }}
        >
          <div className="flex h-full flex-col justify-between gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-tertiary)]">
                  Wallet balance
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                  {formatUsd(dashboardSummary.balance)}
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
                  Your funded balance powers daily listening, art engagement,
                  and sponsored reward tasks. Tier upgrades increase queue
                  size, earning ceiling, and bot access.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-[var(--button-primary-bg)] px-4 text-sm font-semibold text-[var(--button-primary-text)] transition hover:bg-[var(--button-primary-hover)]"
                >
                  Withdraw
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                >
                  Deposit
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[26px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Withdrawable
                  </p>
                  <Wallet className="h-5 w-5 text-[var(--glow)]" />
                </div>
                <p className="mt-4 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {formatUsd(dashboardSummary.withdrawable)}
                </p>
              </div>

              <div className="rounded-[26px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Active queue
                  </p>
                  <CircleGauge className="h-5 w-5 text-[var(--blue)]" />
                </div>
                <p className="mt-4 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {dashboardSummary.activeQueue} tasks
                </p>
              </div>

              <div className="rounded-[26px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Streak
                  </p>
                  <Sparkles className="h-5 w-5 text-[var(--warning)]" />
                </div>
                <p className="mt-4 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {dashboardSummary.streak} days
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 xl:h-full xl:grid-rows-2">
          <div className="h-full rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-panel)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                  Tier progress
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {dashboardSummary.currentTier}
                </h3>
              </div>
              <div className="rounded-2xl bg-[rgba(124,58,237,0.16)] px-3 py-2 text-sm font-medium text-[var(--glow)]">
                {dashboardSummary.tierProgress}% to {dashboardSummary.nextTier}
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--surface-track)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] via-[var(--glow)] to-[var(--blue)]"
                style={{ width: `${dashboardSummary.tierProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Reach the next deposit threshold to unlock higher daily rewards
              and faster queue rotation.
            </p>
          </div>

          <div
            className="surface-glow h-full rounded-[30px] p-4"
            style={{ backgroundImage: 'var(--gradient-hero-accent)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                  AI bot
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {dashboardSummary.aiBotStatus}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-hover)] text-[var(--glow)]">
                <Bot className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Premium automation handles repetitive queue work, but still
              requires periodic human validation to preserve platform integrity.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              Activate automation
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] xl:items-stretch">
        <div className="h-full rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Earnings summary
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                Daily reward velocity
              </h3>
            </div>
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)]">
              {dailyProgress.toFixed(0)}% of today&apos;s cap reached
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Today&apos;s earnings
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">
                {formatUsd(dashboardSummary.todayEarnings)}
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Weekly earnings
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">
                {formatUsd(dashboardSummary.weeklyEarnings)}
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Completion rate
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">
                {dashboardSummary.taskCompletionRate}%
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>Daily limit</span>
              <span>{formatUsd(dashboardSummary.dailyLimit)}</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--surface-track)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] to-[var(--blue)]"
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="h-full rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Quick actions
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
            Keep the queue moving
          </h3>
          <div className="mt-6 space-y-3">
            <Link
              to="/tasks"
              className="flex items-center justify-between rounded-[24px] border border-[var(--border-soft)] bg-[rgba(124,58,237,0.14)] px-4 py-4 transition hover:border-[var(--border-strong)] hover:bg-[rgba(124,58,237,0.18)]"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)]">Start tasks</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Launch the next reward session
                </p>
              </div>
              <Play className="h-5 w-5 text-[var(--glow)]" />
            </Link>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)]">Deposit</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Add USDT to unlock more daily tasks
                </p>
              </div>
              <Wallet className="h-5 w-5 text-[var(--blue)]" />
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)]">Upgrade tier</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Increase daily limit and bot eligibility
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-[var(--warning)]" />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Task preview
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
              Queue ready to earn
            </h3>
          </div>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--glow)] transition hover:text-[var(--text-primary)]"
          >
            Open full task grid
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="thin-scrollbar mt-6 flex gap-4 overflow-x-auto pb-2">
          {previewTasks.map((task) => {
            const ActionIcon = getPreviewActionIcon(task.type)

            return (
              <article
                key={task.id}
                className="group min-w-[260px] flex-1 rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel-strong)] p-4 sm:min-w-[280px]"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[24px]">
                  <img
                    src={task.coverImage}
                    alt={`${task.title} cover art`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
                  <div className="absolute inset-x-4 bottom-4">
                    <div className="inline-flex max-w-full rounded-2xl border border-white/18 bg-black/35 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
                      <span className="truncate">{task.mood}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                        {task.title}
                      </h4>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {task.artist}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[rgba(124,58,237,0.16)] px-3 py-2 text-sm font-medium text-[var(--glow)]">
                      {formatUsd(task.reward)}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-subtle)] px-3 py-1">
                      <Clock3 className="h-4 w-4" />
                      {task.duration}
                    </span>
                    <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1">
                      {task.type}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  >
                    <ActionIcon className="h-4 w-4" />
                    {getPreviewActionLabel(task.type)}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] xl:items-stretch">
        <div className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Recent activity
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                Latest reward events
              </h3>
            </div>
            <Link
              to="/activity"
              className="text-sm font-medium text-[var(--glow)] transition hover:text-[var(--text-primary)]"
            >
              See all
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {activityFeed.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">{item.label}</p>
                  <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                    {item.detail}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
                    +{formatUsd(item.amount)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Integrity checks
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
            Fraud prevention layer
          </h3>

          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(59,130,246,0.14)] text-[var(--blue)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Task validation timers</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Stay on-screen and active until the timer completes.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.14)] text-[var(--glow)]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Periodic bot prompts</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Automation sessions require manual checkpoints to remain valid.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(52,211,153,0.14)] text-[var(--success)]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Live wallet monitoring</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Unusual earning spikes are flagged before withdrawal approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--border-soft)] bg-[rgba(124,58,237,0.12)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Weekly forecast
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">
              {formatCompactUsd(56_000)}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              If you maintain current completion rate and unlock three more live
              music tasks.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
