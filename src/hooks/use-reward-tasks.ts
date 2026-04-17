import { useEffect, useRef, useState } from 'react'
import { AD_VIDEO_ASSETS } from '../data/ad-video-catalog'
import { MUSIC_AUDIO_ASSETS } from '../data/music-audio-catalog'
import { rewardTasks as fallbackTasks, type RewardTask } from '../data/platform-data'
import {
  resolveTaskArtist,
  resolveTaskMood,
  resolveTaskTitle,
} from '../data/task-catalog-metadata'
import { isAIBotAutomationActiveForUser } from '../lib/ai-bot-state'
import {
  getAuthenticatedUser,
  getAuthorizedHeaders,
  refreshAuthenticatedUser,
  resolveUserTierId,
  signOut,
  type SignupTierId,
} from '../lib/auth'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')

const TASKS_ENDPOINT = `${API_BASE_URL}/api/tasks`
const TASKS_COMPLETIONS_ENDPOINT = `${API_BASE_URL}/api/tasks/completions`
const TASKS_COMPLETE_ENDPOINT = `${API_BASE_URL}/api/tasks/complete`
const CACHE_TTL_MS = 30_000
const TASK_RECOMPUTE_INTERVAL_MS = 5_000
const COMPLETION_STORAGE_PREFIX = 'rising-star-task-completed'
const TASK_COMPLETED_EVENT = 'rising-star:task-completed'
const WALLET_UPDATED_EVENT = 'rising-star:wallet-updated'
const REACH_METRICS_STORAGE_KEY = 'rising-star-task-reach-metrics-v1'
const REACH_BASE_MULTIPLIER = 12
const REACH_EXPONENTIAL_GROWTH = 1.42
const REACH_CLICK_BONUS = 2_500
const musicMediaAssets: readonly string[] = MUSIC_AUDIO_ASSETS
const adMediaAssets: readonly string[] = AD_VIDEO_ASSETS
const mediaDurationCache = new Map<string, string>()
const mediaDurationStatus = new Map<string, 'pending' | 'resolved' | 'failed'>()

const typeCoverFallback: Record<RewardTask['type'], string> = {
  Music: '/images/mc1.jpg',
  Art: '/arts/7788954.jpg',
  Ads: '/images/mc20.jpg',
  Social: '/images/mc6.jpg',
}

const adDummyCovers = ['/images/mc20.jpg', '/images/mc21.webp', '/images/mc22.webp']

function readEnvInt(
  raw: string | undefined,
  fallback: number,
  minValue: number,
  maxValue: number,
) {
  const parsed = Number.parseInt(raw ?? '', 10)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(Math.max(parsed, minValue), maxValue)
}

function readEnvFloat(
  raw: string | undefined,
  fallback: number,
  minValue: number,
  maxValue: number,
) {
  const parsed = Number.parseFloat(raw ?? '')
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(Math.max(parsed, minValue), maxValue)
}

const DAILY_LIMIT_BY_TIER: Record<SignupTierId, number> = {
  tier1: readEnvInt(import.meta.env.VITE_DAILY_TASK_LIMIT_TIER1?.toString(), 8, 3, 40),
  tier2: readEnvInt(import.meta.env.VITE_DAILY_TASK_LIMIT_TIER2?.toString(), 12, 4, 60),
  tier3: readEnvInt(import.meta.env.VITE_DAILY_TASK_LIMIT_TIER3?.toString(), 16, 6, 80),
  tier4: readEnvInt(import.meta.env.VITE_DAILY_TASK_LIMIT_TIER4?.toString(), 22, 8, 120),
}

const OPEN_SLOT_LIMIT_BY_TIER: Record<SignupTierId, number> = {
  tier1: readEnvInt(import.meta.env.VITE_OPEN_TASK_SLOTS_TIER1?.toString(), 3, 1, 8),
  tier2: readEnvInt(import.meta.env.VITE_OPEN_TASK_SLOTS_TIER2?.toString(), 4, 2, 12),
  tier3: readEnvInt(import.meta.env.VITE_OPEN_TASK_SLOTS_TIER3?.toString(), 6, 3, 16),
  tier4: readEnvInt(import.meta.env.VITE_OPEN_TASK_SLOTS_TIER4?.toString(), 8, 4, 24),
}

const TASK_REWARD_MULTIPLIER_BY_TIER: Record<SignupTierId, number> = {
  tier1: readEnvFloat(import.meta.env.VITE_TASK_REWARD_MULTIPLIER_TIER1?.toString(), 0.55, 0.1, 2),
  tier2: readEnvFloat(import.meta.env.VITE_TASK_REWARD_MULTIPLIER_TIER2?.toString(), 0.8, 0.1, 2),
  tier3: readEnvFloat(import.meta.env.VITE_TASK_REWARD_MULTIPLIER_TIER3?.toString(), 1, 0.1, 2),
  tier4: readEnvFloat(import.meta.env.VITE_TASK_REWARD_MULTIPLIER_TIER4?.toString(), 1.2, 0.1, 2),
}

const TASK_REWARD_MAX_USD = readEnvFloat(
  import.meta.env.VITE_TASK_REWARD_MAX_USD?.toString(),
  1,
  0.1,
  10,
)

const ART_TASK_DURATION_SECONDS = readEnvInt(
  import.meta.env.VITE_ART_TASK_DURATION_SECONDS?.toString(),
  7,
  3,
  20,
)

const TASK_DAY_START_HOUR = readEnvInt(
  import.meta.env.VITE_TASK_DAY_START_HOUR?.toString(),
  7,
  0,
  23,
)

const TASK_DAY_END_HOUR = readEnvInt(
  import.meta.env.VITE_TASK_DAY_END_HOUR?.toString(),
  23,
  1,
  23,
)

let cachedCatalog: RewardTask[] | null = null
let cachedAt = 0
let inFlightRequest: Promise<RewardTask[]> | null = null

function handleUnauthorized() {
  signOut()

  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
}

function isTaskType(value: unknown): value is RewardTask['type'] {
  return value === 'Music' || value === 'Ads' || value === 'Art' || value === 'Social'
}

function isTaskStatus(value: unknown): value is RewardTask['status'] {
  return value === 'available' || value === 'live' || value === 'completed'
}

function isDayKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function hashString(input: string) {
  let hash = 2166136261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function seededUnit(seed: string) {
  return hashString(seed) / 0xffffffff
}

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(Math.max(value, minValue), maxValue)
}

function pickAdDummyCover(taskId: string) {
  const hash = hashString(taskId)
  return adDummyCovers[hash % adDummyCovers.length]
}

function pickMusicMedia(taskId: string) {
  if (musicMediaAssets.length === 0) {
    return undefined
  }

  const hash = hashString(taskId)
  return musicMediaAssets[hash % musicMediaAssets.length]
}

function pickAdMedia(taskId: string) {
  if (adMediaAssets.length === 0) {
    return undefined
  }

  const hash = hashString(taskId)
  return adMediaAssets[hash % adMediaAssets.length]
}

function sanitizeCoverImage(type: RewardTask['type'], id: string, value: string) {
  const cleanValue = value.trim()
  if (cleanValue.length > 0) {
    return cleanValue
  }

  if (type === 'Ads') {
    return pickAdDummyCover(id)
  }

  return typeCoverFallback[type]
}

function sanitizeMediaUrl(value: string) {
  const cleanValue = value.trim()
  if (cleanValue.length === 0) {
    return ''
  }

  if (cleanValue.startsWith('/')) {
    try {
      return encodeURI(decodeURI(cleanValue))
    } catch {
      return cleanValue
    }
  }

  return cleanValue
}

function secondsToDurationLabel(totalSeconds: number) {
  const safeSeconds = Math.max(Math.round(totalSeconds), 1)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function getCachedMediaDuration(mediaUrl: string | undefined) {
  if (!mediaUrl) {
    return null
  }

  const normalized = sanitizeMediaUrl(mediaUrl)
  if (!normalized) {
    return null
  }

  return mediaDurationCache.get(normalized) ?? null
}

function probeMediaDuration(
  mediaUrl: string,
  mediaType: 'audio' | 'video',
): Promise<string | null> {
  if (typeof document === 'undefined') {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const element =
      mediaType === 'audio'
        ? document.createElement('audio')
        : document.createElement('video')
    let settled = false

    function finish(value: string | null) {
      if (settled) {
        return
      }

      settled = true
      window.clearTimeout(timeoutId)
      element.onloadedmetadata = null
      element.onerror = null
      element.onabort = null
      element.removeAttribute('src')
      element.load()
      resolve(value)
    }

    const timeoutId = window.setTimeout(() => {
      finish(null)
    }, 10_000)

    element.preload = 'metadata'
    element.onloadedmetadata = () => {
      const duration = Number.isFinite(element.duration) ? element.duration : 0
      if (duration <= 0) {
        finish(null)
        return
      }

      finish(secondsToDurationLabel(duration))
    }
    element.onerror = () => finish(null)
    element.onabort = () => finish(null)
    element.src = mediaUrl
    element.load()
  })
}

async function resolveMediaDuration(
  mediaUrl: string | undefined,
  mediaType: 'audio' | 'video',
) {
  if (!mediaUrl) {
    return false
  }

  const normalized = sanitizeMediaUrl(mediaUrl)
  if (!normalized) {
    return false
  }

  const currentStatus = mediaDurationStatus.get(normalized)
  if (
    currentStatus === 'pending' ||
    currentStatus === 'resolved' ||
    currentStatus === 'failed'
  ) {
    return false
  }

  mediaDurationStatus.set(normalized, 'pending')
  const durationLabel = await probeMediaDuration(normalized, mediaType)

  if (durationLabel) {
    mediaDurationCache.set(normalized, durationLabel)
    mediaDurationStatus.set(normalized, 'resolved')
    return true
  }

  mediaDurationStatus.set(normalized, 'failed')
  return false
}

function toRewardTask(value: unknown): RewardTask | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const item = value as Record<string, unknown>

  if (
    typeof item.id !== 'string' ||
    typeof item.title !== 'string' ||
    typeof item.artist !== 'string' ||
    typeof item.duration !== 'string' ||
    typeof item.reward !== 'number' ||
    !isTaskType(item.type) ||
    !isTaskStatus(item.status) ||
    typeof item.mood !== 'string' ||
    typeof item.coverImage !== 'string' ||
    typeof item.reach !== 'string' ||
    typeof item.engagement !== 'string'
  ) {
    return null
  }

  const reward = Number.isFinite(item.reward) ? item.reward : 0
  const mediaUrl =
    typeof item.mediaUrl === 'string' && item.mediaUrl.trim().length > 0
      ? sanitizeMediaUrl(item.mediaUrl)
      : undefined
  const actionUrl =
    typeof item.actionUrl === 'string' && item.actionUrl.trim().length > 0
      ? item.actionUrl.trim()
      : undefined

  const title = resolveTaskTitle(item.type, item.id, item.title)

  return {
    id: item.id,
    title,
    artist: resolveTaskArtist(item.type, item.id, item.title, item.artist),
    duration: item.duration,
    reward,
    type: item.type,
    status: item.status,
    mood: resolveTaskMood(item.type, item.id, item.title, item.mood),
    coverImage: sanitizeCoverImage(item.type, item.id, item.coverImage),
    mediaUrl,
    actionUrl,
    reach: item.reach,
    engagement: item.engagement,
  }
}

function mergeWithFallbackCatalog(remoteTasks: RewardTask[]) {
  const merged = [...remoteTasks]
  const hasRemoteMusic = remoteTasks.some((task) => task.type === 'Music')
  const hasRemoteArt = remoteTasks.some((task) => task.type === 'Art')
  const hasRemoteSocial = remoteTasks.some((task) => task.type === 'Social')
  const hasRemoteAds = remoteTasks.some((task) => task.type === 'Ads')

  if (!hasRemoteMusic) {
    merged.push(...fallbackTasks.filter((task) => task.type === 'Music'))
  }

  if (!hasRemoteArt) {
    merged.push(...fallbackTasks.filter((task) => task.type === 'Art'))
  }

  if (!hasRemoteAds) {
    merged.push(...fallbackTasks.filter((task) => task.type === 'Ads'))
  }

  if (!hasRemoteSocial) {
    merged.push(...fallbackTasks.filter((task) => task.type === 'Social'))
  }

  return merged
}

function getDayKey(now: Date) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDayKeyFromSessionTaskId(taskId: string) {
  const match = /^(\d{4}-\d{2}-\d{2})-/.exec(taskId)
  return match ? match[1] : ''
}

function getDayAtHour(now: Date, hour: number) {
  const date = new Date(now)
  date.setHours(hour, 0, 0, 0)
  return date
}

function getQueueScope(now: Date) {
  const user = getAuthenticatedUser()
  const dayKey = getDayKey(now)
  const accountKey = user?.id || user?.email || 'guest'
  const tierId = resolveUserTierId(user)
  const storageKey = `${COMPLETION_STORAGE_PREFIX}:${accountKey}:${dayKey}`

  return {
    accountKey,
    dayKey,
    tierId,
    user,
    storageKey,
  }
}

function readCompletedTaskIds(storageKey: string) {
  if (typeof window === 'undefined') {
    return new Set<string>()
  }

  const raw = window.localStorage.getItem(storageKey)
  if (!raw) {
    return new Set<string>()
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return new Set<string>()
    }

    return new Set(parsed.filter((entry) => typeof entry === 'string'))
  } catch {
    return new Set<string>()
  }
}

function writeCompletedTaskIds(storageKey: string, completedTaskIds: Set<string>) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify([...completedTaskIds]))
}

function emitTaskCompletedEvent() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(TASK_COMPLETED_EVENT))
}

function readReachMetrics() {
  if (typeof window === 'undefined') {
    return {} as Record<string, number>
  }

  const raw = window.localStorage.getItem(REACH_METRICS_STORAGE_KEY)
  if (!raw) {
    return {} as Record<string, number>
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {} as Record<string, number>
    }

    const normalized: Record<string, number> = {}

    Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
      const parsedCount =
        typeof value === 'number'
          ? value
          : Number.parseInt(String(value ?? ''), 10)

      if (Number.isFinite(parsedCount) && parsedCount > 0) {
        normalized[key] = Math.floor(parsedCount)
      }
    })

    return normalized
  } catch {
    return {} as Record<string, number>
  }
}

function writeReachMetrics(metrics: Record<string, number>) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(REACH_METRICS_STORAGE_KEY, JSON.stringify(metrics))
}

function parseReachLabel(reachLabel: string) {
  const normalized = reachLabel.trim().replace(/,/g, '').toUpperCase()
  if (!normalized) {
    return 0
  }

  const numericPortion = Number.parseFloat(normalized.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(numericPortion)) {
    return 0
  }

  if (normalized.endsWith('B')) {
    return numericPortion * 1_000_000_000
  }

  if (normalized.endsWith('M')) {
    return numericPortion * 1_000_000
  }

  if (normalized.endsWith('K')) {
    return numericPortion * 1_000
  }

  return numericPortion
}

function formatReachValue(value: number) {
  const safeValue = Math.max(value, 0)

  if (safeValue >= 1_000_000_000) {
    return `${(safeValue / 1_000_000_000).toFixed(1)}B`
  }

  if (safeValue >= 1_000_000) {
    return `${(safeValue / 1_000_000).toFixed(1)}M`
  }

  if (safeValue >= 1_000) {
    return `${(safeValue / 1_000).toFixed(1)}K`
  }

  return `${Math.round(safeValue)}`
}

function buildExponentialReach(baseReachLabel: string, clickCount: number) {
  const baseReach = Math.max(parseReachLabel(baseReachLabel), 1_000)
  const scaledBase = baseReach * REACH_BASE_MULTIPLIER
  const normalizedClickCount = Math.max(Math.floor(clickCount), 0)
  const exponentialBoost = Math.pow(REACH_EXPONENTIAL_GROWTH, normalizedClickCount)
  const linearClickBonus = normalizedClickCount * REACH_CLICK_BONUS

  return formatReachValue(scaledBase * exponentialBoost + linearClickBonus)
}

function persistCompletedTask(taskId: string, now: Date) {
  const scope = getQueueScope(now)
  const completedTaskIds = readCompletedTaskIds(scope.storageKey)
  completedTaskIds.add(taskId)
  writeCompletedTaskIds(scope.storageKey, completedTaskIds)
}

function getDailyLimitForTier(tierId: SignupTierId) {
  return DAILY_LIMIT_BY_TIER[tierId]
}

function getExtraTaskSlotsFromCredits(
  user: ReturnType<typeof getAuthenticatedUser>,
) {
  const creditSlots = Number.parseInt(String(user?.taskCredits ?? 0), 10)
  const safeCredits =
    Number.isFinite(creditSlots) && creditSlots > 0 ? creditSlots : 0

  return safeCredits
}

function getOpenSlotLimitForTier(tierId: SignupTierId) {
  return OPEN_SLOT_LIMIT_BY_TIER[tierId]
}

function resolveRewardForTier(baseReward: number, tierId: SignupTierId) {
  const multiplier = TASK_REWARD_MULTIPLIER_BY_TIER[tierId]
  const scaled = Math.max(0, baseReward * multiplier)
  return Number(Math.min(TASK_REWARD_MAX_USD, scaled).toFixed(2))
}

function formatUnlockLabel(unlockAt: Date) {
  return unlockAt.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getAllowedTaskTypesForTier(tierId: SignupTierId): RewardTask['type'][] {
  if (tierId === 'tier4') {
    return ['Music', 'Art', 'Social', 'Ads']
  }

  if (tierId === 'tier3') {
    return ['Ads']
  }

  if (tierId === 'tier2') {
    return ['Social']
  }

  return ['Music', 'Art']
}

function buildPersonalizedQueue(
  catalogTasks: RewardTask[],
  now = new Date(),
  persistedCompletedTaskIds?: ReadonlySet<string>,
) {
  const scope = getQueueScope(now)
  const baseDailyLimit = getDailyLimitForTier(scope.tierId)
  const bonusDailyLimit = getExtraTaskSlotsFromCredits(scope.user)
  const aiBotAutoModeActive = isAIBotAutomationActiveForUser(scope.user, now)
  const allowedTaskTypes = getAllowedTaskTypesForTier(scope.tierId)
  const allowedTaskTypeSet = new Set<RewardTask['type']>(allowedTaskTypes)

  const pool = catalogTasks.filter((task) =>
    allowedTaskTypeSet.has(task.type),
  )
  const fallbackPool = fallbackTasks.filter((task) => allowedTaskTypeSet.has(task.type))
  const effectivePool = pool.length > 0 ? pool : fallbackPool.length > 0 ? fallbackPool : fallbackTasks
  const musicPool = effectivePool.filter((task) => task.type === 'Music')
  const artPool = effectivePool.filter((task) => task.type === 'Art')
  const socialPool = effectivePool.filter((task) => task.type === 'Social')
  const adPool = effectivePool.filter((task) => task.type === 'Ads')
  const minimumMusicPerDay = allowedTaskTypeSet.has('Music') && musicPool.length > 0 ? 1 : 0
  const minimumArtPerDay = allowedTaskTypeSet.has('Art') && artPool.length > 0 ? 1 : 0
  const minimumSocialPerDay =
    allowedTaskTypeSet.has('Social') && socialPool.length > 0 ? 1 : 0
  const minimumAdsPerDay = allowedTaskTypeSet.has('Ads') && adPool.length > 0 ? 1 : 0
  const dailyLimit = baseDailyLimit + bonusDailyLimit
  const openSlotLimit = getOpenSlotLimitForTier(scope.tierId)

  const localCompletedTaskIds = readCompletedTaskIds(scope.storageKey)
  const completedTaskIds = new Set(localCompletedTaskIds)
  const reachMetrics = readReachMetrics()

  persistedCompletedTaskIds?.forEach((taskId) => {
    completedTaskIds.add(taskId)
  })

  if (completedTaskIds.size !== localCompletedTaskIds.size) {
    writeCompletedTaskIds(scope.storageKey, completedTaskIds)
  }
  const dayStart = getDayAtHour(now, TASK_DAY_START_HOUR)
  const dayEnd = getDayAtHour(now, TASK_DAY_END_HOUR)
  const dayEndMs =
    dayEnd.getTime() <= dayStart.getTime()
      ? dayStart.getTime() + 12 * 60 * 60 * 1000
      : dayEnd.getTime()
  const spanMs = Math.max(dayEndMs - dayStart.getTime(), dailyLimit * 35 * 60 * 1000)
  const stepMs = spanMs / Math.max(dailyLimit, 1)
  const jitterMs = Math.max(Math.round(stepMs * 0.38), 7 * 60 * 1000)
  const baseRotationSeed = hashString(`${scope.accountKey}|${scope.dayKey}|rotation`)
  const rotationOffset =
    effectivePool.length > 0 ? baseRotationSeed % effectivePool.length : 0
  let rotationStride =
    effectivePool.length > 1 ? (baseRotationSeed % (effectivePool.length - 1)) + 1 : 1

  if (effectivePool.length > 2 && rotationStride % 2 === 0) {
    rotationStride += 1
  }

  const selectedBaseTasks = Array.from({ length: dailyLimit }).map(
    (_, slotIndex) =>
      effectivePool[
        (rotationOffset + slotIndex * rotationStride) % effectivePool.length
      ],
  )

  function getMixedTypeTargetCount(taskType: RewardTask['type'], availableCount: number) {
    if (scope.tierId !== 'tier4' || availableCount === 0 || selectedBaseTasks.length === 0) {
      return 0
    }

    const ratio = taskType === 'Ads' || taskType === 'Social' ? 0.25 : 0.18
    const desired = Math.round(selectedBaseTasks.length * ratio)
    const minimum = taskType === 'Ads' || taskType === 'Social' ? 2 : 1
    const maximum = taskType === 'Ads' || taskType === 'Social' ? 6 : 4
    const maxAllowedBySlots = Math.max(selectedBaseTasks.length, 0)

    return clamp(desired, minimum, Math.min(maximum, availableCount, maxAllowedBySlots))
  }

  function enforceTypeMaximum(taskType: RewardTask['type'], maxCount: number) {
    if (maxCount < 0 || selectedBaseTasks.length === 0) {
      return
    }

    const typeIndexes = selectedBaseTasks
      .map((task, index) => ({ task, index }))
      .filter((entry) => entry.task.type === taskType)
      .map((entry) => entry.index)

    if (typeIndexes.length <= maxCount) {
      return
    }

    const replacementPool = effectivePool.filter((task) => task.type !== taskType)
    if (replacementPool.length === 0) {
      return
    }

    let replacementCursor = 0

    for (let index = maxCount; index < typeIndexes.length; index += 1) {
      const slotIndex = typeIndexes[index]
      selectedBaseTasks[slotIndex] =
        replacementPool[(rotationOffset + replacementCursor) % replacementPool.length]
      replacementCursor += 1
    }
  }

  function enforceTypeQuota(
    taskType: RewardTask['type'],
    minimumPerDay: number,
    seedShift: number,
  ) {
    if (selectedBaseTasks.length === 0 || minimumPerDay <= 0) {
      return
    }

    const typePool = effectivePool.filter((task) => task.type === taskType)
    if (typePool.length === 0) {
      return
    }

    const requiredCount = Math.min(minimumPerDay, selectedBaseTasks.length)
    let currentCount = selectedBaseTasks.filter((task) => task.type === taskType).length
    let cursor = 0

    while (currentCount < requiredCount && cursor < selectedBaseTasks.length * 8) {
      const targetSlot = (seedShift + cursor * 2) % selectedBaseTasks.length

      if (selectedBaseTasks[targetSlot].type !== taskType) {
        selectedBaseTasks[targetSlot] =
          typePool[(rotationOffset + seedShift + cursor) % typePool.length]
        currentCount += 1
      }

      cursor += 1
    }
  }

  const adTargetCount =
    scope.tierId === 'tier3'
      ? selectedBaseTasks.length
      : getMixedTypeTargetCount('Ads', adPool.length)
  const socialTargetCount =
    scope.tierId === 'tier2'
      ? selectedBaseTasks.length
      : getMixedTypeTargetCount('Social', socialPool.length)

  enforceTypeMaximum('Ads', adTargetCount)
  enforceTypeMaximum('Social', socialTargetCount)
  enforceTypeQuota('Music', minimumMusicPerDay, 3)
  enforceTypeQuota('Art', minimumArtPerDay, 11)
  enforceTypeQuota('Social', Math.max(minimumSocialPerDay, socialTargetCount), 17)

  if (adTargetCount > 0) {
    enforceTypeQuota('Ads', adTargetCount, 19)
  }

  enforceTypeQuota('Ads', minimumAdsPerDay, 23)

  const queue = Array.from({ length: dailyLimit }).map((_, slotIndex) => {
    const baseTask = selectedBaseTasks[slotIndex]

    const slotCenterMs = dayStart.getTime() + stepMs * (slotIndex + 0.5)
    const slotSeed = `${scope.accountKey}|${scope.dayKey}|slot-${slotIndex + 1}`
    const slotJitter = (seededUnit(slotSeed) - 0.5) * jitterMs
    const unlockAtMs = clamp(
      Math.round(slotCenterMs + slotJitter),
      dayStart.getTime(),
      dayEndMs,
    )
    const unlockAt = new Date(unlockAtMs)
    const sessionId = `${scope.dayKey}-${slotIndex + 1}-${baseTask.id}`
    const isCompleted = completedTaskIds.has(sessionId)
    const isTimeLocked = unlockAtMs > now.getTime()
    const reachClickCount = reachMetrics[baseTask.id] ?? 0
    const mediaUrl =
      baseTask.type === 'Music'
        ? baseTask.mediaUrl || pickMusicMedia(sessionId)
        : baseTask.type === 'Ads'
          ? baseTask.mediaUrl || pickAdMedia(sessionId)
          : baseTask.mediaUrl
    const durationFromMedia =
      baseTask.type === 'Music' || baseTask.type === 'Ads'
        ? getCachedMediaDuration(mediaUrl)
        : null
    const normalizedDuration =
      baseTask.type === 'Art'
        ? secondsToDurationLabel(ART_TASK_DURATION_SECONDS)
        : baseTask.duration

    return {
      ...baseTask,
      sourceTaskId: baseTask.id,
      id: sessionId,
      title: resolveTaskTitle(baseTask.type, baseTask.id, baseTask.title),
      artist: resolveTaskArtist(
        baseTask.type,
        baseTask.id,
        baseTask.title,
        baseTask.artist,
      ),
      status: isCompleted ? 'completed' : 'available',
      mood: resolveTaskMood(baseTask.type, baseTask.id, baseTask.title, baseTask.mood),
      reward: resolveRewardForTier(baseTask.reward, scope.tierId),
      duration: durationFromMedia ?? normalizedDuration,
      reach: buildExponentialReach(baseTask.reach, reachClickCount),
      mediaUrl,
      scheduledAt: unlockAt.toISOString(),
      unlockLabel: formatUnlockLabel(unlockAt),
      isTimeLocked,
    } satisfies RewardTask
  })

  const completedCount = queue.filter((task) => task.status === 'completed').length
  const releaseCount = completedCount + openSlotLimit
  queue.forEach((task, index) => {
    if (task.status === 'completed') {
      return
    }

    if (task.isTimeLocked) {
      return
    }

    if (index >= releaseCount) {
      task.isTimeLocked = true
      task.unlockLabel = 'after current queue'
    }
  })

  if (aiBotAutoModeActive) {
    let didAutoComplete = false

    queue.forEach((task) => {
      if (task.isTimeLocked || task.status === 'completed') {
        return
      }

      task.status = 'completed'
      task.isTimeLocked = false
      completedTaskIds.add(task.id)
      didAutoComplete = true
    })

    if (didAutoComplete) {
      writeCompletedTaskIds(scope.storageKey, completedTaskIds)
    }
  }

  return queue.sort((left, right) => {
    if (!left.scheduledAt || !right.scheduledAt) {
      return left.id.localeCompare(right.id)
    }

    return left.scheduledAt.localeCompare(right.scheduledAt)
  })
}

async function loadRewardTaskCatalog() {
  const now = Date.now()

  if (cachedCatalog && now - cachedAt < CACHE_TTL_MS) {
    return cachedCatalog
  }

  if (inFlightRequest) {
    return inFlightRequest
  }

  inFlightRequest = (async () => {
    try {
      const response = await fetch(TASKS_ENDPOINT, {
        headers: {
          ...getAuthorizedHeaders(),
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
        }
        throw new Error(`Task request failed: ${response.status}`)
      }

      const payload: unknown = await response.json()

      if (!Array.isArray(payload)) {
        throw new Error('Invalid task payload')
      }

      const tasks = payload.map(toRewardTask).filter(Boolean) as RewardTask[]

      if (tasks.length === 0) {
        throw new Error('No task entries in payload')
      }

      const mergedTasks = mergeWithFallbackCatalog(tasks)
      cachedCatalog = mergedTasks
      cachedAt = Date.now()
      return mergedTasks
    } catch {
      cachedCatalog = fallbackTasks
      cachedAt = Date.now()
      return fallbackTasks
    } finally {
      inFlightRequest = null
    }
  })()

  return inFlightRequest
}

async function loadCompletedTaskIds(dayKey: string) {
  if (!isDayKey(dayKey)) {
    return new Set<string>()
  }

  try {
    const response = await fetch(
      `${TASKS_COMPLETIONS_ENDPOINT}?dayKey=${encodeURIComponent(dayKey)}`,
      {
        headers: {
          ...getAuthorizedHeaders(),
        },
      },
    )

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized()
      }
      throw new Error(`Completion request failed: ${response.status}`)
    }

    const payload = (await response.json()) as
      | {
          ids?: unknown
        }
      | undefined

    if (!payload || !Array.isArray(payload.ids)) {
      return new Set<string>()
    }

    return new Set(payload.ids.filter((entry): entry is string => typeof entry === 'string'))
  } catch {
    return new Set<string>()
  }
}

async function syncTaskCompletion(task: RewardTask, completedAt: Date) {
  const response = await fetch(TASKS_COMPLETE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify({
      sessionTaskId: task.id,
      sourceTaskId: task.sourceTaskId || task.id,
      title: task.title,
      artist: task.artist,
      type: task.type,
      reward: task.reward,
      dayKey: getDayKeyFromSessionTaskId(task.id) || getDayKey(completedAt),
      scheduledAt: task.scheduledAt || null,
      completedAt: completedAt.toISOString(),
    }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized()
    }
    throw new Error(`Task completion sync failed: ${response.status}`)
  }

  await response.json().catch(() => ({}))
  await refreshAuthenticatedUser()
  window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT))
}

export function useRewardTasks() {
  const [tasks, setTasks] = useState<RewardTask[]>(() => buildPersonalizedQueue(fallbackTasks))
  const [isLoading, setIsLoading] = useState(true)
  const catalogRef = useRef<RewardTask[]>(fallbackTasks)
  const completedTaskIdsRef = useRef<Set<string>>(new Set())
  const syncedTaskIdsRef = useRef<Set<string>>(new Set())
  const syncInFlightTaskIdsRef = useRef<Set<string>>(new Set())

  function recomputeTasks(now = new Date()) {
    setTasks(buildPersonalizedQueue(catalogRef.current, now, completedTaskIdsRef.current))
  }

  async function syncCompletion(task: RewardTask, completedAt: Date) {
    if (syncInFlightTaskIdsRef.current.has(task.id)) {
      return
    }

    syncInFlightTaskIdsRef.current.add(task.id)

    try {
      await syncTaskCompletion(task, completedAt)
      syncedTaskIdsRef.current.add(task.id)
      emitTaskCompletedEvent()
    } catch {
      // Keep local completion state and retry on next task recompute/effect cycle.
    } finally {
      syncInFlightTaskIdsRef.current.delete(task.id)
    }
  }

  function refreshTasks() {
    recomputeTasks(new Date())
  }

  function completeTask(taskId: string) {
    const now = new Date()
    persistCompletedTask(taskId, now)
    completedTaskIdsRef.current.add(taskId)

    let completedTask: RewardTask | null = null

    setTasks((previous) => {
      return previous.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        const nextTask: RewardTask = {
          ...task,
          status: 'completed',
          isTimeLocked: false,
        }

        completedTask = nextTask
        return nextTask
      })
    })

    if (completedTask && !syncedTaskIdsRef.current.has(taskId)) {
      void syncCompletion(completedTask, now)
    }
  }

  function recordTaskOpen(taskId: string) {
    const openedTask = tasks.find((task) => task.id === taskId)
    if (!openedTask) {
      return
    }

    const sourceTaskId = openedTask.sourceTaskId || openedTask.id
    const metrics = readReachMetrics()
    const currentCount = metrics[sourceTaskId] ?? 0
    metrics[sourceTaskId] = currentCount + 1
    writeReachMetrics(metrics)

    recomputeTasks(new Date())
  }

  useEffect(() => {
    let isMounted = true
    let recomputeInterval: number | null = null

    async function loadInitial() {
      const now = new Date()
      const scope = getQueueScope(now)
      const localCompletedTaskIds = readCompletedTaskIds(scope.storageKey)
      localCompletedTaskIds.forEach((taskId) => completedTaskIdsRef.current.add(taskId))

      const [catalog, persistedCompletedTaskIds] = await Promise.all([
        loadRewardTaskCatalog(),
        loadCompletedTaskIds(scope.dayKey),
      ])

      if (!isMounted) {
        return
      }

      catalogRef.current = catalog
      persistedCompletedTaskIds.forEach((taskId) => {
        completedTaskIdsRef.current.add(taskId)
        syncedTaskIdsRef.current.add(taskId)
      })

      setTasks(buildPersonalizedQueue(catalog, now, completedTaskIdsRef.current))
    }

    loadInitial()
      .catch(() => {
        if (!isMounted) {
          return
        }

        recomputeTasks(new Date())
      })
      .finally(() => {
        if (!isMounted) {
          return
        }

        setIsLoading(false)
        recomputeInterval = window.setInterval(() => {
          recomputeTasks(new Date())
        }, TASK_RECOMPUTE_INTERVAL_MS)
      })

    function handleStorageSync(event: StorageEvent) {
      if (!event.key) {
        return
      }

      const isCompletionStorageKey = event.key.startsWith(COMPLETION_STORAGE_PREFIX)
      const isReachStorageKey = event.key === REACH_METRICS_STORAGE_KEY

      if (!isCompletionStorageKey && !isReachStorageKey) {
        return
      }

      if (!isMounted) {
        return
      }

      if (isCompletionStorageKey) {
        const scope = getQueueScope(new Date())
        const localCompletedTaskIds = readCompletedTaskIds(scope.storageKey)
        completedTaskIdsRef.current = new Set([
          ...syncedTaskIdsRef.current,
          ...localCompletedTaskIds,
        ])
      }

      recomputeTasks(new Date())
    }

    function handleVisibilityChange() {
      if (!isMounted || document.visibilityState !== 'visible') {
        return
      }

      recomputeTasks(new Date())
    }

    function handleWindowFocus() {
      if (!isMounted) {
        return
      }

      recomputeTasks(new Date())
    }

    function handleWalletUpdated() {
      if (!isMounted) {
        return
      }

      recomputeTasks(new Date())
    }

    window.addEventListener('storage', handleStorageSync)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener(WALLET_UPDATED_EVENT, handleWalletUpdated)

    return () => {
      isMounted = false

      if (recomputeInterval !== null) {
        window.clearInterval(recomputeInterval)
      }

      window.removeEventListener('storage', handleStorageSync)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener(WALLET_UPDATED_EVENT, handleWalletUpdated)
    }
  }, [])

  useEffect(() => {
    tasks.forEach((task) => {
      if (task.status !== 'completed') {
        return
      }

      completedTaskIdsRef.current.add(task.id)

      if (syncedTaskIdsRef.current.has(task.id)) {
        return
      }

      void syncCompletion(task, new Date())
    })
  }, [tasks])

  useEffect(() => {
    let cancelled = false

    async function syncDurationsFromMedia() {
      const probes = tasks
        .filter(
          (task) =>
            (task.type === 'Music' || task.type === 'Ads') &&
            typeof task.mediaUrl === 'string' &&
            task.mediaUrl.trim().length > 0,
        )
        .map((task) =>
          resolveMediaDuration(
            task.mediaUrl,
            task.type === 'Music' ? 'audio' : 'video',
          ),
        )

      if (probes.length === 0) {
        return
      }

      const results = await Promise.all(probes)
      if (cancelled) {
        return
      }

      if (results.some(Boolean)) {
        recomputeTasks(new Date())
      }
    }

    void syncDurationsFromMedia()

    return () => {
      cancelled = true
    }
  }, [tasks])

  return {
    tasks,
    isLoading,
    completeTask,
    recordTaskOpen,
    refreshTasks,
  }
}
