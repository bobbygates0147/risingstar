import clsx from 'clsx'
import {
  Clock3,
  Filter,
  Heart,
  Palette,
  Play,
  Radio,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { rewardTasks, type TaskType } from '../data/platform-data'
import { formatUsd } from '../lib/format'

type TaskFilter = 'All' | TaskType | 'Completed'

const taskFilters: TaskFilter[] = ['All', 'Music', 'Ads', 'Art', 'Completed']

export function TasksPage() {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('All')

  const filteredTasks = rewardTasks.filter((task) => {
    if (activeFilter === 'All') {
      return true
    }

    if (activeFilter === 'Completed') {
      return task.status === 'completed'
    }

    return task.type === activeFilter
  })

  const completedCount = rewardTasks.filter(
    (task) => task.status === 'completed',
  ).length

  const liveCount = rewardTasks.filter((task) => task.status !== 'completed')
    .length

  const artQueueCount = rewardTasks.filter(
    (task) => task.type === 'Art' && task.status !== 'completed',
  ).length

  const projectedReward = rewardTasks
    .filter((task) => task.status !== 'completed')
    .reduce((total, task) => total + task.reward, 0)

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <div
          className="surface-glow overflow-hidden rounded-[30px] p-6 lg:col-span-2"
          style={{ backgroundImage: 'var(--gradient-hero-tasks)' }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-tertiary)]">
                Task grid
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Music listens, art likes, and sponsored clips in one queue
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                Filter by music, art, ads, or completed jobs. Each task keeps
                its own reward amount, timer, and validation state so the
                payout remains traceable.
              </p>
            </div>

            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-overlay)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Bot assist
              </p>
              <p className="mt-2 font-medium text-[var(--text-primary)]">
                Available with manual checkpoints
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Projected reward
          </p>
          <p className="mt-3 font-display text-4xl font-semibold text-[var(--text-primary)]">
            {formatUsd(projectedReward)}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            Current open queue if you clear every available task before reset.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Ready now</p>
            <Radio className="h-5 w-5 text-[var(--glow)]" />
          </div>
          <p className="mt-4 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {liveCount}
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Completed today
            </p>
            <Sparkles className="h-5 w-5 text-[var(--warning)]" />
          </div>
          <p className="mt-4 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {completedCount}
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Art queue
            </p>
            <Palette className="h-5 w-5 text-[var(--blue)]" />
          </div>
          <p className="mt-4 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {artQueueCount}
          </p>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Filters
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
              Sort the active queue
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {taskFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={clsx(
                  'inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition',
                  activeFilter === filter
                    ? 'border-[var(--border-strong)] bg-[rgba(124,58,237,0.16)] text-[var(--text-primary)]'
                    : 'border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
                )}
              >
                <Filter className="h-4 w-4" />
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed'
            const isArtTask = task.type === 'Art'
            const actionLabel = isCompleted
              ? 'Completed'
              : task.status === 'live'
                ? 'Resume Task'
                : 'Start Task'

            return (
              <article
                key={task.id}
                className="group rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel-strong)] p-4 transition hover:-translate-y-1 hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)]"
              >
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-[22px]"
                >
                  <img
                    src={task.coverImage}
                    alt={`${task.title} cover art`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/18 to-black/12" />
                  <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                    <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                      {task.type}
                    </span>
                    <span
                      className={clsx(
                        'rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur-sm',
                        isCompleted
                          ? 'border border-emerald-400/20 bg-emerald-400/15 text-emerald-200'
                          : task.status === 'live'
                            ? 'border border-sky-400/20 bg-sky-400/15 text-sky-100'
                            : 'border border-white/20 bg-black/25 text-white/90',
                      )}
                    >
                      {isCompleted
                        ? 'Completed'
                        : task.status === 'live'
                          ? 'In progress'
                          : 'Ready'}
                    </span>
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <span className="inline-flex max-w-full rounded-2xl border border-white/18 bg-black/35 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                      <span className="truncate">{task.mood}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                    {task.title}
                  </h4>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {task.artist}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      {isArtTask ? 'Action' : 'Duration'}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                      {isArtTask ? (
                        <>
                          <Heart className="h-4 w-4 text-[var(--warning)]" />
                          Like
                        </>
                      ) : (
                        <>
                          <Clock3 className="h-4 w-4 text-[var(--glow)]" />
                          {task.duration}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Reward
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                      {formatUsd(task.reward)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                  <span>{task.reach} reach</span>
                  <span>{task.engagement} engagement</span>
                </div>

                <button
                  type="button"
                  disabled={isCompleted}
                  className={clsx(
                    'mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition',
                    isCompleted
                      ? 'cursor-not-allowed border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-tertiary)]'
                      : 'border-[var(--border-strong)] bg-[rgba(124,58,237,0.14)] text-[var(--text-primary)] hover:bg-[rgba(124,58,237,0.22)]',
                  )}
                >
                  <Play className="h-4 w-4" />
                  {actionLabel}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
