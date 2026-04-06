import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clapperboard,
  Crown,
  Disc3,
  Palette,
  Target,
} from 'lucide-react'
import { useMemo, useState } from 'react'

type ActivityFilter = 'All' | 'Earnings' | 'Tasks' | 'Withdrawals'
type ActivityCategory = Exclude<ActivityFilter, 'All'>
type ActivityKind =
  | 'music'
  | 'ads'
  | 'art'
  | 'milestone'
  | 'bonus'
  | 'withdrawal'
  | 'deposit'

type ActivityLogEntry = {
  id: string
  amount: number
  category: ActivityCategory
  dateLabel: string
  detail: string
  kind: ActivityKind
  timeLabel: string
  title: string
}

const activityFilters: ActivityFilter[] = [
  'All',
  'Earnings',
  'Tasks',
  'Withdrawals',
]

const activityEntries: ActivityLogEntry[] = [
  {
    id: 'activity-1',
    title: "Completed 'Blinding Lights'",
    detail: 'The Weeknd • Music listening task',
    amount: 2.5,
    category: 'Tasks',
    dateLabel: 'Today',
    timeLabel: '2 hours ago',
    kind: 'music',
  },
  {
    id: 'activity-2',
    title: 'Earning milestone reached',
    detail: '$50 daily target achieved',
    amount: 5,
    category: 'Earnings',
    dateLabel: 'Today',
    timeLabel: '3 hours ago',
    kind: 'milestone',
  },
  {
    id: 'activity-3',
    title: "Completed 'Stay'",
    detail: 'The Kid LAROI, Justin Bieber • Music listening task',
    amount: 1.8,
    category: 'Tasks',
    dateLabel: 'Today',
    timeLabel: '5 hours ago',
    kind: 'music',
  },
  {
    id: 'activity-4',
    title: 'Withdrawal processed',
    detail: 'Bank transfer to ****4521',
    amount: -100,
    category: 'Withdrawals',
    dateLabel: 'Yesterday',
    timeLabel: 'April 5, 2026',
    kind: 'withdrawal',
  },
  {
    id: 'activity-5',
    title: 'Premium tier bonus',
    detail: 'Daily premium member bonus earned',
    amount: 5,
    category: 'Earnings',
    dateLabel: 'Yesterday',
    timeLabel: 'April 5, 2026',
    kind: 'bonus',
  },
  {
    id: 'activity-6',
    title: "Completed 'Heat Waves'",
    detail: 'Glass Animals • Music listening task',
    amount: 3.2,
    category: 'Tasks',
    dateLabel: 'Yesterday',
    timeLabel: 'April 5, 2026',
    kind: 'music',
  },
  {
    id: 'activity-7',
    title: "Completed 'Good 4 U'",
    detail: 'Olivia Rodrigo • Music listening task',
    amount: 2.1,
    category: 'Tasks',
    dateLabel: 'Yesterday',
    timeLabel: 'April 5, 2026',
    kind: 'music',
  },
  {
    id: 'activity-8',
    title: "Completed 'Anti-Hero'",
    detail: 'Taylor Swift • Music listening task',
    amount: 2.8,
    category: 'Tasks',
    dateLabel: 'April 4, 2026',
    timeLabel: 'April 4, 2026',
    kind: 'music',
  },
  {
    id: 'activity-9',
    title: "Completed 'As It Was'",
    detail: 'Harry Styles • Music listening task',
    amount: 2.4,
    category: 'Tasks',
    dateLabel: 'April 4, 2026',
    timeLabel: 'April 4, 2026',
    kind: 'music',
  },
  {
    id: 'activity-10',
    title: 'Art engagement complete',
    detail: 'Museum Glow • Like verified',
    amount: 1.3,
    category: 'Tasks',
    dateLabel: 'April 4, 2026',
    timeLabel: 'April 4, 2026',
    kind: 'art',
  },
  {
    id: 'activity-11',
    title: 'Sponsored clip watched',
    detail: 'City Lights Ad • Playback verified',
    amount: 1.1,
    category: 'Tasks',
    dateLabel: 'April 4, 2026',
    timeLabel: 'April 4, 2026',
    kind: 'ads',
  },
  {
    id: 'activity-12',
    title: 'Wallet top-up settled',
    detail: 'USDT deposit cleared to your wallet',
    amount: 50,
    category: 'Earnings',
    dateLabel: 'April 3, 2026',
    timeLabel: 'April 3, 2026',
    kind: 'deposit',
  },
]

const signedUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function formatSignedUsd(amount: number) {
  const absoluteAmount = signedUsdFormatter.format(Math.abs(amount))

  return amount >= 0 ? `+${absoluteAmount}` : `-${absoluteAmount}`
}

type ActivityVisualConfig = {
  icon: LucideIcon
  iconClassName: string
}

function getActivityVisual(kind: ActivityKind): ActivityVisualConfig {
  if (kind === 'music') {
    return {
      icon: Disc3,
      iconClassName: 'bg-[rgba(16,185,129,0.16)] text-emerald-300',
    }
  }

  if (kind === 'ads') {
    return {
      icon: Clapperboard,
      iconClassName: 'bg-[rgba(59,130,246,0.16)] text-sky-300',
    }
  }

  if (kind === 'art') {
    return {
      icon: Palette,
      iconClassName: 'bg-[rgba(236,72,153,0.16)] text-rose-300',
    }
  }

  if (kind === 'withdrawal') {
    return {
      icon: ArrowUpRight,
      iconClassName: 'bg-[rgba(244,63,94,0.18)] text-rose-300',
    }
  }

  if (kind === 'bonus') {
    return {
      icon: Crown,
      iconClassName: 'bg-[rgba(251,191,36,0.18)] text-amber-300',
    }
  }

  if (kind === 'deposit') {
    return {
      icon: ArrowDownLeft,
      iconClassName: 'bg-[rgba(16,185,129,0.18)] text-emerald-300',
    }
  }

  return {
    icon: Target,
    iconClassName: 'bg-[rgba(34,197,94,0.16)] text-lime-300',
  }
}

export function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('All')
  const [visibleCount, setVisibleCount] = useState(9)

  const filteredEntries = useMemo(() => {
    return activeFilter === 'All'
      ? activityEntries
      : activityEntries.filter((entry) => entry.category === activeFilter)
  }, [activeFilter])

  const visibleEntries = filteredEntries.slice(0, visibleCount)
  const hasMoreEntries = visibleEntries.length < filteredEntries.length

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, ActivityLogEntry[]>()

    visibleEntries.forEach((entry) => {
      const existingGroup = groups.get(entry.dateLabel)
      if (existingGroup) {
        existingGroup.push(entry)
      } else {
        groups.set(entry.dateLabel, [entry])
      }
    })

    return Array.from(groups.entries())
  }, [visibleEntries])

  const todayNet = activityEntries
    .filter((entry) => entry.dateLabel === 'Today')
    .reduce((total, entry) => total + entry.amount, 0)

  const taskCount = activityEntries.filter((entry) => entry.category === 'Tasks')
    .length

  const withdrawalTotal = activityEntries
    .filter((entry) => entry.category === 'Withdrawals')
    .reduce((total, entry) => total + Math.abs(entry.amount), 0)

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div
          className="surface-glow overflow-hidden rounded-[30px] p-6"
          style={{ backgroundImage: 'var(--gradient-hero-tasks)' }}
        >
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-tertiary)]">
            Activity
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Track earnings, tasks, and withdrawals in one timeline
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Every reward action is logged with verification context, payout
            amount, and processing status so your wallet activity remains
            transparent.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <article className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4 shadow-[var(--shadow-panel)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Net today
            </p>
            <p
              className={clsx(
                'mt-2 font-display text-3xl font-semibold',
                todayNet >= 0 ? 'text-emerald-300' : 'text-rose-300',
              )}
            >
              {formatSignedUsd(todayNet)}
            </p>
          </article>

          <article className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4 shadow-[var(--shadow-panel)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Tasks logged
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">
              {taskCount}
            </p>
          </article>

          <article className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4 shadow-[var(--shadow-panel)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Withdrawn
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-rose-300">
              {compactUsdFormatter.format(withdrawalTotal)}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {activityFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setActiveFilter(filter)
                  setVisibleCount(9)
                }}
                className={clsx(
                  'inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition',
                  activeFilter === filter
                    ? 'border-[var(--border-strong)] bg-[rgba(124,58,237,0.18)] text-[var(--text-primary)]'
                    : 'border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            {filteredEntries.length} activities
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {groupedEntries.map(([dateLabel, entries]) => (
            <div key={dateLabel}>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {dateLabel}
              </h3>
              <div className="mt-3 divide-y divide-[var(--border-soft)] rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel-strong)]">
                {entries.map((entry) => {
                  const visual = getActivityVisual(entry.kind)
                  const Icon = visual.icon

                  return (
                    <article
                      key={entry.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3.5 sm:px-5"
                    >
                      <span
                        className={clsx(
                          'mt-1 flex h-10 w-10 items-center justify-center rounded-xl',
                          visual.iconClassName,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)] sm:text-base">
                          {entry.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-[var(--text-secondary)] sm:text-sm">
                          {entry.detail}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className={clsx(
                            'text-sm font-semibold sm:text-base',
                            entry.amount >= 0 ? 'text-emerald-300' : 'text-rose-300',
                          )}
                        >
                          {formatSignedUsd(entry.amount)}
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--text-tertiary)] sm:text-xs">
                          {entry.timeLabel}
                        </p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {hasMoreEntries && (
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + 6)}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
          >
            Load More Activities
          </button>
        )}
      </section>
    </div>
  )
}
