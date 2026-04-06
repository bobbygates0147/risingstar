import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  CheckCircle2,
  Clapperboard,
  Coins,
  Disc3,
  Heart,
  Palette,
  Play,
  Sparkles,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { rewardTasks, type TaskStatus, type TaskType } from '../data/platform-data'
import { formatUsd } from '../lib/format'

const AD_VIDEO_SOURCE =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

type TaskPlayerConfig = {
  heading: string
  subtitle: string
  actionHint: string
  actionLabel: string
  mode: 'music' | 'video' | 'like'
  icon: LucideIcon
  badgeClassName: string
  ctaClassName: string
  rules: string[]
}

const taskPlayerConfig: Record<TaskType, TaskPlayerConfig> = {
  Music: {
    heading: 'Music Task',
    subtitle: 'Listen and complete the full timer to unlock your reward.',
    actionHint: 'Active session',
    actionLabel: 'Play and hold this screen',
    mode: 'music',
    icon: Disc3,
    badgeClassName:
      'border-[rgba(167,139,250,0.42)] bg-[rgba(124,58,237,0.2)] text-[var(--glow)]',
    ctaClassName:
      'bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] text-white shadow-[0_20px_45px_rgba(124,58,237,0.45)]',
    rules: ['Stay on this screen', 'Do not mute audio', 'Complete full duration'],
  },
  Ads: {
    heading: 'Sponsored Ad Task',
    subtitle: 'Watch the sponsor clip from start to finish with active focus.',
    actionHint: 'Sponsor session',
    actionLabel: 'Play full ad video',
    mode: 'video',
    icon: Clapperboard,
    badgeClassName:
      'border-[rgba(251,191,36,0.36)] bg-[rgba(251,191,36,0.16)] text-amber-200',
    ctaClassName:
      'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_20px_45px_rgba(251,146,60,0.35)]',
    rules: [
      'Do not skip the ad video',
      'Keep this tab active until complete',
      'Sound must remain enabled',
    ],
  },
  Art: {
    heading: 'Art Like Task',
    subtitle: 'Open the artwork and complete the like interaction to earn.',
    actionHint: 'Like required',
    actionLabel: 'Like artwork to continue',
    mode: 'like',
    icon: Palette,
    badgeClassName:
      'border-[rgba(248,113,113,0.35)] bg-[rgba(244,63,94,0.14)] text-rose-200',
    ctaClassName:
      'bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white shadow-[0_20px_45px_rgba(236,72,153,0.38)]',
    rules: [
      'Tap the like button on the artwork',
      'Keep this tab active until the timer ends',
      'Do not navigate away before verification',
    ],
  },
}

function parseDurationToSeconds(duration: string) {
  const [minutesRaw, secondsRaw] = duration.split(':')
  const minutes = Number(minutesRaw)
  const seconds = Number(secondsRaw)

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return 0
  }

  return Math.max(minutes, 0) * 60 + Math.max(seconds, 0)
}

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(Math.round(totalSeconds), 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getSessionProgress(status: TaskStatus) {
  if (status === 'completed') {
    return 100
  }

  if (status === 'live') {
    return 64
  }

  return 0
}

export function TaskPlayerPage() {
  const { taskId } = useParams()
  const task = rewardTasks.find((candidate) => candidate.id === taskId)

  if (!task) {
    return (
      <section className="mx-auto max-w-3xl rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-8 text-center shadow-[var(--shadow-panel)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
          Task player
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">
          Session not found
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
          The selected task could not be loaded. Open the queue and choose an
          available music, ad, or art session.
        </p>
        <Link
          to="/tasks"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to task queue
        </Link>
      </section>
    )
  }

  const config = taskPlayerConfig[task.type]
  const TaskIcon = config.icon
  const completionPercent = getSessionProgress(task.status)
  const totalSeconds = parseDurationToSeconds(task.duration)
  const elapsedSeconds = Math.round((completionPercent / 100) * totalSeconds)
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0)
  const sessionLabel =
    task.status === 'completed'
      ? 'Completed'
      : task.status === 'live'
        ? 'In progress'
        : 'Ready'
  const isMusicSession = config.mode === 'music'
  const isVideoSession = config.mode === 'video'
  const isLikeSession = config.mode === 'like'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/tasks"
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tasks
        </Link>

        <span
          className={clsx(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]',
            config.badgeClassName,
          )}
        >
          <TaskIcon className="h-3.5 w-3.5" />
          {task.type} session
        </span>
      </div>

      <section className="surface-glow relative overflow-hidden rounded-[34px] border border-[var(--border-soft)] bg-[var(--surface-panel-strong)] p-6 shadow-[var(--shadow-panel)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -left-12 top-8 h-48 w-48 rounded-full bg-[rgba(124,58,237,0.18)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-3rem] top-0 h-56 w-56 rounded-full bg-[rgba(59,130,246,0.2)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[rgba(236,72,153,0.12)] blur-3xl" />

        <div
          className={clsx(
            'relative mx-auto flex flex-col items-center text-center',
            isVideoSession
              ? 'max-w-4xl'
              : isLikeSession
                ? 'max-w-3xl'
                : 'max-w-[26rem]',
          )}
        >
          {isVideoSession && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.16)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-amber-200">
              <Clapperboard className="h-3.5 w-3.5" />
              Video playback required
            </div>
          )}
          {isLikeSession && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.16)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-rose-200">
              <Heart className="h-3.5 w-3.5" />
              Like interaction required
            </div>
          )}
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            {config.heading}
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {config.subtitle}
          </p>

          <div className="mt-6 w-full overflow-hidden rounded-[30px] border border-[var(--border-soft)] shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
            <div
              className={clsx(
                'relative w-full overflow-hidden bg-black',
                isVideoSession ? 'aspect-video' : 'h-72 sm:h-80',
              )}
            >
              {isVideoSession ? (
                <video
                  className="h-full w-full object-cover"
                  controls
                  controlsList="nodownload noplaybackrate"
                  playsInline
                  poster={task.coverImage}
                  preload="metadata"
                >
                  <source src={AD_VIDEO_SOURCE} type="video/mp4" />
                </video>
              ) : (
                <>
                  <img
                    src={task.coverImage}
                    alt={`${task.title} cover`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/16 to-black/8" />
                </>
              )}

              <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
                  {task.type}
                </span>
                <span
                  className={clsx(
                    'rounded-full border px-3 py-1 text-[11px] font-medium backdrop-blur-sm',
                    task.status === 'completed'
                      ? 'border-emerald-400/25 bg-emerald-400/15 text-emerald-200'
                      : task.status === 'live'
                        ? 'border-sky-400/25 bg-sky-400/15 text-sky-100'
                        : 'border-white/20 bg-black/30 text-white/90',
                  )}
                >
                  {sessionLabel}
                </span>
              </div>

              <div className="absolute inset-x-4 bottom-4">
                <span className="inline-flex max-w-full rounded-2xl border border-white/20 bg-black/35 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                  <span className="truncate">{task.mood}</span>
                </span>
              </div>
            </div>
          </div>

          <h2 className="mt-6 font-display text-[2rem] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.35rem]">
            {task.title}
          </h2>
          <p className="mt-2 text-base text-[var(--text-secondary)]">{task.artist}</p>

          {isVideoSession ? (
            <div className="mt-6 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Video validation
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Play the ad from start to finish. Seeking, tab switches, or muted
                playback can invalidate reward eligibility.
              </p>
            </div>
          ) : isLikeSession ? (
            <div className="mt-6 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-3">
              <button
                type="button"
                className={clsx(
                  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition hover:brightness-110',
                  config.ctaClassName,
                )}
                aria-label={config.actionLabel}
              >
                <Heart className="h-4 w-4" />
                Like Artwork
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={clsx(
                'task-player-ring mt-6 inline-flex h-20 w-20 items-center justify-center rounded-full transition hover:scale-[1.03]',
                config.ctaClassName,
              )}
              aria-label={config.actionLabel}
            >
              <Play className="h-8 w-8" />
            </button>
          )}

          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            {config.actionHint}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {config.actionLabel}
          </p>

          {isMusicSession && (
            <div className="task-player-bars mt-5 flex h-8 items-end gap-1.5">
              {Array.from({ length: 14 }).map((_, index) => (
                <span
                  key={index}
                  className="w-1.5 rounded-full bg-gradient-to-t from-[var(--purple)] to-[var(--blue)]"
                  style={{ animationDelay: `${index * 80}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative mt-8 rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Session timer
              </p>
              <p className="mt-2 font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
                {formatDuration(remainingSeconds)}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">remaining</p>
            </div>

            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Status
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <Sparkles className="h-4 w-4 text-[var(--glow)]" />
                {sessionLabel}
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--surface-track)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] via-[var(--glow)] to-[var(--blue)] transition-[width] duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>{formatDuration(elapsedSeconds)} elapsed</span>
            <span>{completionPercent}% complete</span>
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 sm:p-6">
            <h3 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
              Task Rules
            </h3>
            <ul className="mt-4 space-y-3">
              {config.rules.map((rule) => (
                <li
                  key={rule}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-2.5 text-sm text-[var(--text-secondary)]"
                >
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(124,58,237,0.2)] text-[var(--glow)]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Reward
            </p>
            <p className="mt-3 inline-flex items-center gap-2 font-display text-4xl font-semibold text-[var(--success)]">
              <Coins className="h-7 w-7 text-[var(--success)]" />
              {formatUsd(task.reward)}
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              Paid instantly after all session checks pass.
            </p>

            <div className="mt-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-3 text-sm">
              <p className="inline-flex items-center gap-2 font-medium text-[var(--text-primary)]">
                <TaskIcon className="h-4 w-4 text-[var(--glow)]" />
                {task.type} validation
              </p>
              <p className="mt-1 text-[var(--text-secondary)]">
                Reach and engagement are checked before payout.
              </p>
            </div>
          </article>
        </div>

        <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Duration
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              {task.duration}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Reach
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              {task.reach}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Engagement
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              {task.engagement}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
