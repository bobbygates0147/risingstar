import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clapperboard,
  Coins,
  Disc3,
  ExternalLink,
  Heart,
  Palette,
  Play,
  Send,
  Sparkles,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TaskCoverImage } from '../components/task-cover-image'
import { AD_VIDEO_ASSETS } from '../data/ad-video-catalog'
import { MUSIC_AUDIO_ASSETS } from '../data/music-audio-catalog'
import { type TaskType } from '../data/platform-data'
import { useRewardTasks } from '../hooks/use-reward-tasks'
import { formatUsd } from '../lib/format'
import { showToast } from '../lib/toast'

type TaskPlayerConfig = {
  heading: string
  subtitle: string
  actionHint: string
  actionLabel: string
  mode: 'music' | 'video' | 'like' | 'social'
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
    subtitle: 'Watch the sponsored clip from start to finish to unlock your reward.',
    actionHint: 'Sponsor session',
    actionLabel: 'Play full sponsor clip',
    mode: 'video',
    icon: Clapperboard,
    badgeClassName:
      'border-[rgba(251,191,36,0.36)] bg-[rgba(251,191,36,0.16)] text-amber-200',
    ctaClassName:
      'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_20px_45px_rgba(251,146,60,0.35)]',
    rules: [
      'Watch the sponsor creative in full',
      'Keep this tab active until complete',
      'Do not skip before validation ends',
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
  Social: {
    heading: 'Social Follow Task',
    subtitle: 'Open the channel, follow or join, then keep this session active.',
    actionHint: 'Social action required',
    actionLabel: 'Open channel and verify',
    mode: 'social',
    icon: Send,
    badgeClassName:
      'border-[rgba(56,189,248,0.36)] bg-[rgba(14,165,233,0.14)] text-sky-200',
    ctaClassName:
      'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 shadow-[0_20px_45px_rgba(14,165,233,0.32)]',
    rules: [
      'Open the social link',
      'Follow the account or join the channel',
      'Return here and keep the timer active',
    ],
  },
}

const MEDIA_END_COMPLETION_THRESHOLD_SECONDS = 2
const SEEK_TOLERANCE_SECONDS = 0.2
const SEEK_WARNING_COOLDOWN_MS = 4000

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

function normalizeMediaSource(value: string) {
  if (!value.startsWith('/')) {
    return value
  }

  try {
    return encodeURI(decodeURI(value))
  } catch {
    return value
  }
}

function buildMediaCandidates(primary: string, catalog: readonly string[]) {
  const candidates: string[] = []
  const seen = new Set<string>()

  function pushCandidate(value: string) {
    const normalized = normalizeMediaSource(value.trim())
    if (!normalized || seen.has(normalized)) {
      return
    }

    seen.add(normalized)
    candidates.push(normalized)
  }

  if (primary.trim().length > 0) {
    pushCandidate(primary)
  }

  catalog.forEach((entry) => pushCandidate(entry))
  return candidates
}

export function TaskPlayerPage() {
  const {
    tasks: rewardTasks,
    isLoading,
    completeTask,
    recordTaskOpen,
  } = useRewardTasks()
  const navigate = useNavigate()
  const { taskId } = useParams()
  const task = rewardTasks.find((candidate) => candidate.id === taskId)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const completionNotifiedRef = useRef(false)
  const shouldAutoReturnRef = useRef(false)
  const resumeAfterUnmuteRef = useRef(false)
  const openedSessionRef = useRef<string | null>(null)
  const maxPlayedSecondsRef = useRef(0)
  const lastSeekWarningAtRef = useRef(0)
  const config = task ? taskPlayerConfig[task.type] : null
  const totalSeconds = task ? parseDurationToSeconds(task.duration) : 0
  const taskSessionId = task?.id ?? ''
  const taskStatus = task?.status ?? ''
  const taskDuration = task?.duration ?? ''
  const taskTitle = task?.title ?? ''
  const taskReward = Number(task?.reward ?? 0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [likedArtwork, setLikedArtwork] = useState(false)
  const [visitedSocialLink, setVisitedSocialLink] = useState(false)
  const [muteBlocked, setMuteBlocked] = useState(false)
  const [visibilityBlocked, setVisibilityBlocked] = useState(false)
  const [musicMediaIndex, setMusicMediaIndex] = useState(0)
  const [musicMediaExhausted, setMusicMediaExhausted] = useState(false)
  const [adMediaIndex, setAdMediaIndex] = useState(0)
  const [adMediaExhausted, setAdMediaExhausted] = useState(false)
  const isTimeLocked = Boolean(task?.isTimeLocked)
  const isCompleted = task?.status === 'completed'
  const elapsedSeconds = Math.max(totalSeconds - remainingSeconds, 0)
  const completionPercent = isCompleted
    ? 100
    : totalSeconds > 0
      ? Math.min(Math.round((elapsedSeconds / totalSeconds) * 100), 100)
      : 0
  const sessionLabel =
    isCompleted
      ? 'Completed'
      : isTimeLocked
        ? 'Scheduled'
        : hasStarted
          ? 'In progress'
          : 'Ready'
  const isMusicSession = config?.mode === 'music'
  const isVideoSession = config?.mode === 'video'
  const isLikeSession = config?.mode === 'like'
  const isSocialSession = config?.mode === 'social'
  const isArtLikeVerifying =
    isLikeSession &&
    likedArtwork &&
    hasStarted &&
    !isCompleted &&
    remainingSeconds > 0
  const isSocialVerifying =
    isSocialSession &&
    visitedSocialLink &&
    hasStarted &&
    !isCompleted &&
    remainingSeconds > 0
  const mediaUrl = task?.mediaUrl
  const socialActionUrl = task?.actionUrl || ''
  const normalizedMediaUrl = typeof mediaUrl === 'string' ? normalizeMediaSource(mediaUrl) : ''

  const musicMediaCandidates = useMemo(() => {
    if (task?.type !== 'Music') {
      return []
    }

    return buildMediaCandidates(normalizedMediaUrl, MUSIC_AUDIO_ASSETS)
  }, [normalizedMediaUrl, task?.type])

  const adMediaCandidates = useMemo(() => {
    if (task?.type !== 'Ads') {
      return []
    }

    return buildMediaCandidates(normalizedMediaUrl, AD_VIDEO_ASSETS)
  }, [normalizedMediaUrl, task?.type])

  const currentMusicUrl =
    musicMediaExhausted || musicMediaCandidates.length === 0
      ? ''
      : musicMediaCandidates[Math.min(musicMediaIndex, musicMediaCandidates.length - 1)] || ''
  const currentAdVideoUrl =
    adMediaExhausted || adMediaCandidates.length === 0
      ? ''
      : adMediaCandidates[Math.min(adMediaIndex, adMediaCandidates.length - 1)] || ''

  const hasMusicMedia = currentMusicUrl.length > 0
  const hasAdVideo = currentAdVideoUrl.length > 0
  const canPlayAdVideo = hasAdVideo
  const requiresMediaValidation =
    (isMusicSession && hasMusicMedia) || (isVideoSession && canPlayAdVideo)
  const validationBlocked = muteBlocked || visibilityBlocked
  const validationBlockMessage = visibilityBlocked
    ? 'Return to this tab to continue validation.'
    : muteBlocked
      ? 'Audio is muted. Unmute playback to continue validation.'
      : ''
  const sessionSubtitle =
    !task || !config
      ? ''
      : task.type === 'Ads'
      ? canPlayAdVideo
        ? 'Watch the sponsor clip from start to finish with active focus.'
        : 'Sponsor creative is being prepared for this session.'
      : task.type === 'Music'
        ? hasMusicMedia
          ? 'Press play and keep audio running until timer reaches zero.'
          : 'No audio media found for this session yet.'
      : task.type === 'Social'
        ? socialActionUrl
          ? 'Open the social link, complete the follow or join action, then return for timer validation.'
          : 'Social link is being prepared for this session.'
      : config.subtitle
  const actionHint =
    isTimeLocked
      ? 'Scheduled unlock'
      : task?.type === 'Ads'
      ? canPlayAdVideo
        ? 'Sponsor session'
        : 'Sponsor session'
      : config?.actionHint || 'Active session'
  const actionLabel =
    isTimeLocked
      ? `Opens ${task?.unlockLabel || 'later today'}`
      : task?.type === 'Ads'
      ? canPlayAdVideo
        ? 'Play full ad video'
        : 'Preview sponsor creative'
      : task?.type === 'Music'
        ? 'Play music and stay active'
      : task?.type === 'Social'
        ? visitedSocialLink
          ? 'Social action opened'
          : 'Open social link'
      : config?.actionLabel || 'Start session'
  const taskRules =
    task?.type === 'Ads' && canPlayAdVideo
      ? [
          'Do not skip the ad video',
          'Keep this tab active until complete',
          'Sound should remain enabled',
        ]
      : task?.type === 'Music' && hasMusicMedia
        ? [
            'Keep audio playing until timer completes',
            'Do not mute the tab during validation',
            'Stay on this screen for full payout eligibility',
          ]
        : task?.type === 'Social'
          ? [
              'Open the account or channel link',
              'Follow, join, or subscribe where required',
              'Return here and keep this screen active until verified',
            ]
        : config?.rules || []

  function isMediaMuted(mediaElement: HTMLMediaElement) {
    return mediaElement.muted || mediaElement.volume <= 0.001
  }

  function notifySkipBlocked() {
    const now = Date.now()
    if (now - lastSeekWarningAtRef.current < SEEK_WARNING_COOLDOWN_MS) {
      return
    }

    lastSeekWarningAtRef.current = now
    showToast({
      variant: 'warning',
      title: 'Skipping is disabled',
      description: 'Music and ad playback must run from start to finish at 1x speed.',
    })
  }

  function updateMaxPlayedSeconds(mediaElement: HTMLMediaElement) {
    const currentTime = Number.isFinite(mediaElement.currentTime)
      ? mediaElement.currentTime
      : 0

    if (currentTime > maxPlayedSecondsRef.current) {
      maxPlayedSecondsRef.current = currentTime
    }
  }

  function enforceNoSkip(mediaElement: HTMLMediaElement) {
    if (isTimeLocked || isCompleted || !requiresMediaValidation) {
      return
    }

    const currentTime = Number.isFinite(mediaElement.currentTime)
      ? mediaElement.currentTime
      : 0
    const maxAllowed = maxPlayedSecondsRef.current + SEEK_TOLERANCE_SECONDS

    if (currentTime > maxAllowed) {
      mediaElement.currentTime = Math.max(maxPlayedSecondsRef.current, 0)
      notifySkipBlocked()
    }
  }

  function enforcePlaybackRate(mediaElement: HTMLMediaElement) {
    if (!Number.isFinite(mediaElement.playbackRate)) {
      return
    }

    if (Math.abs(mediaElement.playbackRate - 1) <= 0.001) {
      return
    }

    mediaElement.playbackRate = 1
    notifySkipBlocked()
  }

  function updateMuteValidation(mediaElement: HTMLMediaElement) {
    if (isTimeLocked || isCompleted || !requiresMediaValidation) {
      resumeAfterUnmuteRef.current = false
      return false
    }

    const muted = isMediaMuted(mediaElement)
    setMuteBlocked(muted)

    if (muted) {
      setIsRunning(false)
      resumeAfterUnmuteRef.current = true
      if (!mediaElement.paused) {
        mediaElement.pause()
      }
      return true
    }

    if (resumeAfterUnmuteRef.current && !visibilityBlocked) {
      resumeAfterUnmuteRef.current = false
      void mediaElement
        .play()
        .then(() => {
          setHasStarted(true)
          setIsRunning(true)
        })
        .catch(() => {
          setIsRunning(false)
        })
      return false
    }

    if (!mediaElement.paused && !visibilityBlocked) {
      setHasStarted(true)
      setIsRunning(true)
    }

    return muted
  }

  function continueCountdownAfterMediaEnd() {
    if (isTimeLocked || isCompleted) {
      return
    }

    setHasStarted(true)
    setRemainingSeconds((current) =>
      current <= MEDIA_END_COMPLETION_THRESHOLD_SECONDS ? 0 : current,
    )
    // Keep the interval alive so near-end drift does not freeze at 0:01.
    setIsRunning(true)
  }

  function handleMediaPause(mediaElement: HTMLMediaElement) {
    if (isTimeLocked || isCompleted) {
      return
    }

    const hasFiniteDuration =
      Number.isFinite(mediaElement.duration) && mediaElement.duration > 0
    const isNaturalEndPause =
      mediaElement.ended ||
      (hasFiniteDuration &&
        mediaElement.currentTime >= mediaElement.duration - 0.35)

    if (isNaturalEndPause) {
      continueCountdownAfterMediaEnd()
      return
    }

    setIsRunning(false)
  }

  function startSession() {
    if (!task) {
      return
    }

    if (isTimeLocked || isCompleted) {
      return
    }

    setHasStarted(true)

    if (isLikeSession) {
      setIsRunning(likedArtwork)
      return
    }

    if (isSocialSession) {
      setIsRunning(visitedSocialLink)
      return
    }

    if (isMusicSession && musicRef.current) {
      void musicRef.current.play().catch(() => {
        setIsRunning(false)
      })
      return
    }

    if (isVideoSession && videoRef.current) {
      void videoRef.current.play().catch(() => {
        setIsRunning(false)
      })
      return
    }

    setIsRunning(true)
  }

  useEffect(() => {
    if (!taskSessionId) {
      return
    }

    completionNotifiedRef.current = false
    resumeAfterUnmuteRef.current = false
    maxPlayedSecondsRef.current = 0
    lastSeekWarningAtRef.current = 0
    const nextTotalSeconds = parseDurationToSeconds(taskDuration)
    const resetTimer = window.setTimeout(() => {
      setMusicMediaIndex(0)
      setMusicMediaExhausted(false)
      setAdMediaIndex(0)
      setAdMediaExhausted(false)
      setRemainingSeconds(taskStatus === 'completed' ? 0 : nextTotalSeconds)
      setHasStarted(taskStatus === 'completed')
      setIsRunning(false)
      setLikedArtwork(taskStatus === 'completed')
      setVisitedSocialLink(taskStatus === 'completed')
      setMuteBlocked(false)
      setVisibilityBlocked(false)
    }, 0)

    return () => {
      window.clearTimeout(resetTimer)
    }
  }, [taskDuration, taskSessionId, taskStatus])

  useEffect(() => {
    if (!taskSessionId) {
      return
    }

    if (openedSessionRef.current === taskSessionId) {
      return
    }

    openedSessionRef.current = taskSessionId
    recordTaskOpen(taskSessionId)
  }, [recordTaskOpen, taskSessionId])

  useEffect(() => {
    if (!hasStarted || !requiresMediaValidation || isTimeLocked || isCompleted) {
      return
    }

    function handleVisibilityValidation() {
      const hidden =
        typeof document !== 'undefined' && document.visibilityState !== 'visible'
      setVisibilityBlocked(hidden)

      if (!hidden) {
        return
      }

      setIsRunning(false)
      musicRef.current?.pause()
      videoRef.current?.pause()
    }

    handleVisibilityValidation()
    document.addEventListener('visibilitychange', handleVisibilityValidation)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityValidation)
    }
  }, [hasStarted, isCompleted, isTimeLocked, requiresMediaValidation])

  useEffect(() => {
    if (!taskSessionId || !hasStarted || !isRunning || isCompleted || isTimeLocked) {
      return
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [taskSessionId, hasStarted, isRunning, isCompleted, isTimeLocked])

  useEffect(() => {
    if (
      !taskSessionId ||
      !hasStarted ||
      isCompleted ||
      isTimeLocked ||
      remainingSeconds > 0 ||
      completionNotifiedRef.current
    ) {
      return
    }

    if (isLikeSession && !likedArtwork) {
      return
    }

    if (isSocialSession && !visitedSocialLink) {
      return
    }

    completionNotifiedRef.current = true
    shouldAutoReturnRef.current = true
    showToast({
      variant: 'success',
      title: `${formatUsd(taskReward)} credited`,
      description: `${taskTitle} is complete. Reward posted to your balance.`,
    })
    completeTask(taskSessionId)
  }, [
    completeTask,
    hasStarted,
    isCompleted,
    isLikeSession,
    isSocialSession,
    isTimeLocked,
    likedArtwork,
    remainingSeconds,
    taskReward,
    taskSessionId,
    taskTitle,
    visitedSocialLink,
  ])

  useEffect(() => {
    if (!taskSessionId || !isCompleted || !shouldAutoReturnRef.current) {
      return
    }

    shouldAutoReturnRef.current = false
    const redirectTimer = window.setTimeout(() => {
      navigate('/tasks', { replace: true })
    }, 450)

    return () => {
      window.clearTimeout(redirectTimer)
    }
  }, [isCompleted, navigate, taskSessionId])

  useEffect(() => {
    if (!isCompleted) {
      return
    }

    musicRef.current?.pause()
    videoRef.current?.pause()
  }, [isCompleted])

  if (isLoading && !task) {
    return (
      <section className="mx-auto max-w-3xl rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-8 text-center shadow-[var(--shadow-panel)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
          Task player
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">
          Loading session
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
          Fetching the latest task data from backend.
        </p>
      </section>
    )
  }

  if (!task || !config) {
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

  const TaskIcon = config.icon

  return (
    <div key={task.id} className="mx-auto max-w-5xl space-y-6">
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
              {hasAdVideo ? 'Video playback required' : 'Dummy media mode'}
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
            {sessionSubtitle}
          </p>
          {isTimeLocked && (
            <div className="mt-4 w-full rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                Scheduled session
              </p>
              <p className="mt-1 text-sm text-amber-100/90">
                This task unlocks at {task.unlockLabel || 'later today'}.
              </p>
            </div>
          )}

          <div className="mt-6 w-full overflow-hidden rounded-[30px] border border-[var(--border-soft)] shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
            <div
              className={clsx(
                'relative w-full overflow-hidden bg-black',
                isVideoSession ? 'aspect-video' : 'h-72 sm:h-80',
              )}
            >
              {isVideoSession ? (
                canPlayAdVideo && !isTimeLocked ? (
                  <video
                    key={`${task.id}-${currentAdVideoUrl}`}
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    controls
                    controlsList="nodownload noplaybackrate"
                    playsInline
                    poster={task.coverImage}
                    preload="metadata"
                    src={currentAdVideoUrl}
                    onLoadedMetadata={(event) => {
                      maxPlayedSecondsRef.current = Math.max(
                        Number.isFinite(event.currentTarget.currentTime)
                          ? event.currentTarget.currentTime
                          : 0,
                        0,
                      )
                      event.currentTarget.playbackRate = 1
                    }}
                    onPlay={(event) => {
                      if (isTimeLocked || isCompleted) {
                        return
                      }

                      enforceNoSkip(event.currentTarget)
                      enforcePlaybackRate(event.currentTarget)

                      if (updateMuteValidation(event.currentTarget)) {
                        event.currentTarget.pause()
                        return
                      }

                      setVisibilityBlocked(false)
                      setHasStarted(true)
                      setIsRunning(true)
                    }}
                    onPause={(event) => {
                      handleMediaPause(event.currentTarget)
                    }}
                    onTimeUpdate={(event) => {
                      updateMaxPlayedSeconds(event.currentTarget)
                    }}
                    onSeeking={(event) => {
                      enforceNoSkip(event.currentTarget)
                    }}
                    onRateChange={(event) => {
                      enforcePlaybackRate(event.currentTarget)
                    }}
                    onEnded={() => {
                      continueCountdownAfterMediaEnd()
                    }}
                    onVolumeChange={(event) => {
                      updateMuteValidation(event.currentTarget)
                    }}
                  onError={() => {
                    setIsRunning(false)
                    setAdMediaIndex((current) => {
                      const next = current + 1
                      if (next < adMediaCandidates.length) {
                        maxPlayedSecondsRef.current = 0
                        return next
                      }
                      setAdMediaExhausted(true)
                        return current
                      })
                    }}
                  />
                ) : (
                  <>
                    <TaskCoverImage
                      key={`${task.id}-${task.coverImage}`}
                      src={task.coverImage}
                      type={task.type}
                      alt={`${task.title} cover`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/16 to-black/8" />
                    <div className="absolute bottom-16 right-4 rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
                      {isTimeLocked
                        ? `Unlocks ${task.unlockLabel || 'later'}`
                        : 'Sponsor preview'}
                    </div>
                  </>
                )
              ) : (
                <>
                  <TaskCoverImage
                    key={`${task.id}-${task.coverImage}`}
                    src={task.coverImage}
                    type={task.type}
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
                    isCompleted
                      ? 'border-emerald-400/25 bg-emerald-400/15 text-emerald-200'
                      : isTimeLocked
                        ? 'border-amber-300/25 bg-amber-400/15 text-amber-100'
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

          {isMusicSession && (
            <div className="mt-4 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Music playback
              </p>
              {hasMusicMedia ? (
                <audio
                  key={`${task.id}-${currentMusicUrl}`}
                  ref={musicRef}
                  className="mt-3 w-full"
                  controls
                  preload="metadata"
                  src={currentMusicUrl}
                  onLoadedMetadata={(event) => {
                    maxPlayedSecondsRef.current = Math.max(
                      Number.isFinite(event.currentTarget.currentTime)
                        ? event.currentTarget.currentTime
                        : 0,
                      0,
                    )
                    event.currentTarget.playbackRate = 1
                  }}
                  onPlay={(event) => {
                    if (isTimeLocked || isCompleted) {
                      return
                    }

                    enforceNoSkip(event.currentTarget)
                    enforcePlaybackRate(event.currentTarget)

                    if (updateMuteValidation(event.currentTarget)) {
                      event.currentTarget.pause()
                      return
                    }

                    setVisibilityBlocked(false)
                    setHasStarted(true)
                    setIsRunning(true)
                  }}
                  onPause={(event) => {
                    handleMediaPause(event.currentTarget)
                  }}
                  onTimeUpdate={(event) => {
                    updateMaxPlayedSeconds(event.currentTarget)
                  }}
                  onSeeking={(event) => {
                    enforceNoSkip(event.currentTarget)
                  }}
                  onRateChange={(event) => {
                    enforcePlaybackRate(event.currentTarget)
                  }}
                  onEnded={() => {
                    continueCountdownAfterMediaEnd()
                  }}
                  onVolumeChange={(event) => {
                    updateMuteValidation(event.currentTarget)
                  }}
                  onError={() => {
                    setIsRunning(false)
                    setMusicMediaIndex((current) => {
                      const next = current + 1
                      if (next < musicMediaCandidates.length) {
                        maxPlayedSecondsRef.current = 0
                        return next
                      }
                      setMusicMediaExhausted(true)
                      return current
                    })
                  }}
                />
              ) : (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Audio file is not available for this session yet.
                </p>
              )}
            </div>
          )}

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
                {isTimeLocked
                  ? `This sponsor task is locked until ${task.unlockLabel || 'later today'}.`
                  : canPlayAdVideo
                  ? 'Play the ad from start to finish. Seeking, tab switches, or muted playback can invalidate reward eligibility.'
                  : 'This sponsor creative is queued in image preview mode for task validation.'}
              </p>
            </div>
          ) : isMusicSession ? (
            <div className="mt-6 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Audio validation
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Keep playback active until the timer reaches zero to validate this session.
              </p>
            </div>
          ) : isLikeSession ? (
            <div className="mt-6 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-3">
              <button
                type="button"
                disabled={isTimeLocked || isCompleted || likedArtwork}
                onClick={() => {
                  if (isTimeLocked || isCompleted) {
                    return
                  }

                  setLikedArtwork(true)
                  setHasStarted(true)
                  setIsRunning(true)
                }}
                className={clsx(
                  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70',
                  config.ctaClassName,
                )}
                aria-label={config.actionLabel}
              >
                <Heart className="h-4 w-4" />
                {likedArtwork ? 'Artwork Liked' : 'Like Artwork'}
              </button>
              {isArtLikeVerifying && (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--glow)] border-t-transparent" />
                  Verifying like action
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatDuration(remainingSeconds)}
                  </span>
                </div>
              )}
            </div>
          ) : isSocialSession ? (
            <div className="mt-6 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-3">
              <button
                type="button"
                disabled={isTimeLocked || isCompleted || !socialActionUrl}
                onClick={() => {
                  if (isTimeLocked || isCompleted || !socialActionUrl) {
                    return
                  }

                  window.open(socialActionUrl, '_blank', 'noopener,noreferrer')
                  setVisitedSocialLink(true)
                  setHasStarted(true)
                  setIsRunning(true)
                }}
                className={clsx(
                  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70',
                  config.ctaClassName,
                )}
                aria-label={config.actionLabel}
              >
                <ExternalLink className="h-4 w-4" />
                {visitedSocialLink ? 'Social Link Opened' : 'Open Social Link'}
              </button>
              <p className="mt-3 break-all text-xs text-[var(--text-secondary)]">
                {socialActionUrl || 'Social link unavailable'}
              </p>
              {isSocialVerifying && (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--glow)] border-t-transparent" />
                  Verifying social action
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatDuration(remainingSeconds)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={isTimeLocked || isCompleted}
              onClick={startSession}
              className={clsx(
                'task-player-ring mt-6 inline-flex h-20 w-20 items-center justify-center rounded-full transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70',
                config.ctaClassName,
              )}
              aria-label={actionLabel}
            >
              <Play className="h-8 w-8" />
            </button>
          )}

          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            {actionHint}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {actionLabel}
          </p>
          {validationBlocked && (
            <div className="mt-4 w-full rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-left text-sm text-rose-100">
              {validationBlockMessage}
            </div>
          )}

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
              {taskRules.map((rule) => (
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
