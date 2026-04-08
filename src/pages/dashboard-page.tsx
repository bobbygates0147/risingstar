import clsx from 'clsx'
import {
  ArrowDownLeft,
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
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PaginationControls } from '../components/pagination-controls'
import { TaskCoverImage } from '../components/task-cover-image'
import { type TaskType } from '../data/platform-data'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { useRewardTasks } from '../hooks/use-reward-tasks'
import { getAuthenticatedUser } from '../lib/auth'
import {
  getAIBotLocalState,
  isAIBotAutomationActiveForUser,
  isAIBotDisplayActiveForUser,
} from '../lib/ai-bot-state'
import { formatUsd } from '../lib/format'
import { getNextQueuedTask, getReadyTaskCount } from '../lib/task-queue'

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
  const PAGE_SIZE = 5
  const navigate = useNavigate()
  const { tasks: rewardTasks } = useRewardTasks()
  const { summary: dashboardSummary, activity: activityFeed } = useDashboardData()
  const [activityPage, setActivityPage] = useState(1)
  const [aiPulseNowMs, setAiPulseNowMs] = useState(() => Date.now())
  const currentUser = getAuthenticatedUser()
  const hasWithdrawableBalance = dashboardSummary.withdrawable > 0

  const readyTasks = rewardTasks.filter(
    (task) => task.status !== 'completed' && !task.isTimeLocked,
  )
  const previewTasks =
    (readyTasks.length > 0
      ? readyTasks
      : rewardTasks.filter((task) => task.status !== 'completed')
    ).slice(0, 4)
  const activeQueueCount = useMemo(() => getReadyTaskCount(rewardTasks), [rewardTasks])
  const nextScheduledTask = useMemo(() => getNextQueuedTask(rewardTasks), [rewardTasks])

  const scheduleText = nextScheduledTask
    ? `Task schedule: next unlock ${nextScheduledTask.unlockAt.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })} - ${nextScheduledTask.task.type} session`
    : readyTasks.length > 0
      ? `Task schedule: ${readyTasks.length} sessions ready right now`
      : 'Task schedule: queue synced. New sessions unlock across the day.'
  const nextTaskPath = readyTasks[0] ? `/tasks/${readyTasks[0].id}` : '/tasks'
  const aiNow = useMemo(() => new Date(aiPulseNowMs), [aiPulseNowMs])
  const aiLocalState = useMemo(
    () => getAIBotLocalState(aiNow),
    [aiNow, currentUser?.id, currentUser?.email],
  )
  const aiBotDisplayActive = useMemo(
    () => isAIBotDisplayActiveForUser(currentUser, aiNow),
    [aiNow, currentUser],
  )
  const aiBotAutomationActive = useMemo(
    () => isAIBotAutomationActiveForUser(currentUser, aiNow),
    [aiNow, currentUser],
  )
  const aiBotStatusLabel = useMemo(() => {
    if (aiBotAutomationActive) {
      return 'Active'
    }

    if (aiBotDisplayActive && aiLocalState.checkpointRequired) {
      return 'Checkpoint Required'
    }

    if (aiBotDisplayActive) {
      return 'Active'
    }

    return dashboardSummary.aiBotStatus
  }, [aiBotAutomationActive, aiBotDisplayActive, aiLocalState.checkpointRequired, dashboardSummary.aiBotStatus])
  const aiBotActionLabel = aiBotDisplayActive
    ? 'Manage automation'
    : 'Activate automation'

  const dailyProgress = Math.min(
    Math.max(Number(dashboardSummary.taskCompletionRate || 0), 0),
    100,
  )
  const activityPageCount = Math.max(1, Math.ceil(activityFeed.length / PAGE_SIZE))

  useEffect(() => {
    setActivityPage((current) => Math.min(current, activityPageCount))
  }, [activityPageCount])

  useEffect(() => {
    const pulseTimer = window.setInterval(() => {
      setAiPulseNowMs(Date.now())
    }, 30_000)

    return () => {
      window.clearInterval(pulseTimer)
    }
  }, [])

  const paginatedActivityFeed = useMemo(() => {
    const startIndex = (activityPage - 1) * PAGE_SIZE
    return activityFeed.slice(startIndex, startIndex + PAGE_SIZE)
  }, [activityFeed, activityPage])

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
                <p className="mt-3 inline-flex rounded-full border border-[var(--border-soft)] bg-[var(--surface-overlay)] px-3 py-1 text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                  {scheduleText}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  disabled={!hasWithdrawableBalance}
                  onClick={() => {
                    if (!hasWithdrawableBalance) {
                      return
                    }

                    navigate('/wallet?modal=withdraw')
                  }}
                  className={clsx(
                    'inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-panel)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)]',
                    hasWithdrawableBalance
                      ? ''
                      : 'cursor-not-allowed border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-tertiary)] hover:bg-[var(--surface-subtle)]',
                  )}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Withdraw
                </button>
                <Link
                  to="/wallet?modal=deposit"
                  className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:brightness-110"
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  Deposit
                </Link>
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
                  {activeQueueCount} tasks
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
                  {aiBotStatusLabel}
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
            <Link
              to="/ai-bot"
              className="mt-3 inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              {aiBotActionLabel}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
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
              {dailyProgress.toFixed(0)}% of today&apos;s queue completed
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Today&apos;s task rewards
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
                <span>Daily task quota</span>
                <span>{`${dashboardSummary.dailyLimit} tasks`}</span>
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
              to={nextTaskPath}
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

            <Link
              to="/wallet?modal=deposit"
              className="flex w-full items-center justify-between rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)]">Deposit</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Add USD to unlock more daily tasks
                </p>
              </div>
              <Wallet className="h-5 w-5 text-[var(--blue)]" />
            </Link>

            <Link
              to="/profile?modal=tier-upgrade"
              className="flex w-full items-center justify-between rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)]">Upgrade tier</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Increase daily limit and bot eligibility
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-[var(--warning)]" />
            </Link>
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
                  <TaskCoverImage
                    src={task.coverImage}
                    type={task.type}
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

                  <Link
                    to={`/tasks/${task.id}`}
                    className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  >
                    <ActionIcon className="h-4 w-4" />
                    {getPreviewActionLabel(task.type)}
                  </Link>
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
            {activityFeed.length === 0 && (
              <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
                No activity yet. Complete your first task to see earnings history.
              </div>
            )}

            {paginatedActivityFeed.map((item) => (
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
          <PaginationControls
            itemLabel="activities"
            onPageChange={setActivityPage}
            page={activityPage}
            totalItems={activityFeed.length}
          />
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
              {formatUsd(dashboardSummary.weeklyEarnings)}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              If you maintain current completion rate and clear the open queue this week.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
