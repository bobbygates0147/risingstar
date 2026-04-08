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
import { useEffect, useMemo, useState } from 'react'
import { PaginationControls } from '../components/pagination-controls'
import {
  type ActivityLogEntry,
  type ActivityLogFilter,
  type ActivityLogKind,
  useActivityLog,
} from '../hooks/use-activity-log'

const activityFilters: ActivityLogFilter[] = [
  'All',
  'Earnings',
  'Tasks',
  'Withdrawals',
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

function getActivityVisual(kind: ActivityLogKind): ActivityVisualConfig {
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
  const PAGE_SIZE = 5
  const { entries: activityEntries, isLoading } = useActivityLog()
  const [activeFilter, setActiveFilter] = useState<ActivityLogFilter>('All')
  const [activityPage, setActivityPage] = useState(1)

  const filteredEntries = useMemo(() => {
    return activeFilter === 'All'
      ? activityEntries
      : activityEntries.filter((entry) => entry.category === activeFilter)
  }, [activeFilter, activityEntries])

  const activityPageCount = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE))

  useEffect(() => {
    setActivityPage((current) => Math.min(current, activityPageCount))
  }, [activityPageCount])

  const paginatedEntries = useMemo(() => {
    const startIndex = (activityPage - 1) * PAGE_SIZE
    return filteredEntries.slice(startIndex, startIndex + PAGE_SIZE)
  }, [activityPage, filteredEntries])

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, ActivityLogEntry[]>()

    paginatedEntries.forEach((entry) => {
      const existingGroup = groups.get(entry.dateLabel)
      if (existingGroup) {
        existingGroup.push(entry)
      } else {
        groups.set(entry.dateLabel, [entry])
      }
    })

    return Array.from(groups.entries())
  }, [paginatedEntries])

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
                  setActivityPage(1)
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

        {isLoading && (
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Syncing activity log
          </p>
        )}

        <div className="mt-6 space-y-6">
          {groupedEntries.length === 0 && (
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
              No activity yet. Complete a task to generate your first activity event.
            </div>
          )}

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

        <PaginationControls
          className="mt-6"
          itemLabel="activities"
          onPageChange={setActivityPage}
          page={activityPage}
          totalItems={filteredEntries.length}
        />
      </section>
    </div>
  )
}
