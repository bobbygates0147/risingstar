import { getAuthenticatedUser, type AuthUser } from './auth'

const AI_BOT_STORAGE_PREFIX = 'rising-star-ai-bot-state'
const AI_BOT_STORAGE_KEY_LEGACY = 'rising-star-ai-bot-state'

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

export const AI_BOT_DEFAULT_FEE_USD = readEnvFloat(
  import.meta.env.VITE_AI_BOT_FEE_USD?.toString(),
  18.14,
  0.1,
  50_000,
)

export const AI_BOT_DEFAULT_CHECKPOINT_INTERVAL_MINUTES = readEnvInt(
  import.meta.env.VITE_AI_BOT_CHECKPOINT_INTERVAL_MINUTES?.toString(),
  24 * 60,
  30,
  7 * 24 * 60,
)

export type AIBotLocalState = {
  enabled: boolean
  activatedAt: string | null
  paymentMethod: string
  feeUsd: number
  checkpointIntervalMinutes: number
  checkpointRequired: boolean
  lastCheckpointAt: string | null
  nextCheckpointAt: string | null
}

function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function getCurrentAccountKey() {
  const user = getAuthenticatedUser()
  return user?.id || user?.email || 'guest'
}

function getStorageKey() {
  return `${AI_BOT_STORAGE_PREFIX}:${getCurrentAccountKey()}`
}

function createDefaultState(): AIBotLocalState {
  return {
    enabled: false,
    activatedAt: null,
    paymentMethod: '',
    feeUsd: AI_BOT_DEFAULT_FEE_USD,
    checkpointIntervalMinutes: AI_BOT_DEFAULT_CHECKPOINT_INTERVAL_MINUTES,
    checkpointRequired: false,
    lastCheckpointAt: null,
    nextCheckpointAt: null,
  }
}

function normalizeState(value: unknown): AIBotLocalState {
  if (!value || typeof value !== 'object') {
    return createDefaultState()
  }

  const input = value as Partial<AIBotLocalState>
  const fallback = createDefaultState()

  return {
    enabled: Boolean(input.enabled),
    activatedAt:
      typeof input.activatedAt === 'string' || input.activatedAt === null
        ? input.activatedAt
        : fallback.activatedAt,
    paymentMethod: typeof input.paymentMethod === 'string' ? input.paymentMethod : '',
    feeUsd:
      typeof input.feeUsd === 'number' && Number.isFinite(input.feeUsd)
        ? input.feeUsd
        : fallback.feeUsd,
    checkpointIntervalMinutes:
      typeof input.checkpointIntervalMinutes === 'number' &&
      Number.isFinite(input.checkpointIntervalMinutes)
        ? input.checkpointIntervalMinutes
        : fallback.checkpointIntervalMinutes,
    checkpointRequired: Boolean(input.checkpointRequired),
    lastCheckpointAt:
      typeof input.lastCheckpointAt === 'string' || input.lastCheckpointAt === null
        ? input.lastCheckpointAt
        : fallback.lastCheckpointAt,
    nextCheckpointAt:
      typeof input.nextCheckpointAt === 'string' || input.nextCheckpointAt === null
        ? input.nextCheckpointAt
        : fallback.nextCheckpointAt,
  }
}

function writeLocalState(state: AIBotLocalState) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(getStorageKey(), JSON.stringify(state))
  storage.removeItem(AI_BOT_STORAGE_KEY_LEGACY)
}

function readRawState() {
  const storage = getStorage()

  if (!storage) {
    return createDefaultState()
  }

  const raw = storage.getItem(getStorageKey())
  if (!raw) {
    return createDefaultState()
  }

  try {
    return normalizeState(JSON.parse(raw))
  } catch {
    return createDefaultState()
  }
}

function getFutureCheckpoint(now: Date, intervalMinutes: number) {
  const next = new Date(now.getTime() + intervalMinutes * 60 * 1000)
  return next.toISOString()
}

function syncCheckpointRequirement(state: AIBotLocalState, now: Date) {
  if (!state.activatedAt || !state.enabled) {
    return {
      ...state,
      checkpointRequired: false,
    }
  }

  if (!state.nextCheckpointAt) {
    return {
      ...state,
      checkpointRequired: false,
      nextCheckpointAt: getFutureCheckpoint(now, state.checkpointIntervalMinutes),
    }
  }

  const dueAt = new Date(state.nextCheckpointAt).getTime()
  if (Number.isNaN(dueAt)) {
    return {
      ...state,
      checkpointRequired: true,
    }
  }

  return {
    ...state,
    checkpointRequired: dueAt <= now.getTime(),
  }
}

function toTimestamp(value: string | null | undefined) {
  if (!value || typeof value !== 'string') {
    return Number.NaN
  }

  return new Date(value).getTime()
}

export function getAIBotLocalState(now = new Date()) {
  const current = readRawState()
  const synced = syncCheckpointRequirement(current, now)

  if (JSON.stringify(current) !== JSON.stringify(synced)) {
    writeLocalState(synced)
  }

  return synced
}

export function activateAIBotLocalState(input: {
  paymentMethod: string
  feeUsd: number
}) {
  const now = new Date()
  const current = getAIBotLocalState(now)
  const nowIso = now.toISOString()

  const nextCheckpointAt = getFutureCheckpoint(now, current.checkpointIntervalMinutes)

  const nextState: AIBotLocalState = {
    ...current,
    enabled: true,
    activatedAt: current.activatedAt || nowIso,
    paymentMethod: input.paymentMethod,
    feeUsd: input.feeUsd > 0 ? input.feeUsd : current.feeUsd,
    checkpointRequired: false,
    lastCheckpointAt: nowIso,
    nextCheckpointAt,
  }

  writeLocalState(nextState)
  return nextState
}

export function setAIBotLocalEnabled(enabled: boolean) {
  const now = new Date()
  const current = getAIBotLocalState(now)

  const activatedAt = current.activatedAt || (enabled ? now.toISOString() : null)

  const nextState: AIBotLocalState = {
    ...current,
    enabled,
    activatedAt,
    checkpointRequired: enabled ? current.checkpointRequired : false,
  }

  writeLocalState(nextState)
  return nextState
}

export function completeAIBotLocalCheckpoint() {
  const now = new Date()
  const current = getAIBotLocalState(now)
  const nowIso = now.toISOString()

  const nextState: AIBotLocalState = {
    ...current,
    enabled: true,
    checkpointRequired: false,
    lastCheckpointAt: nowIso,
    nextCheckpointAt: getFutureCheckpoint(now, current.checkpointIntervalMinutes),
  }

  writeLocalState(nextState)
  return nextState
}

export function isAIBotAutomationActive(now = new Date()) {
  const current = getAIBotLocalState(now)
  return Boolean(current.activatedAt) && current.enabled && !current.checkpointRequired
}

export function isAIBotBackendAutomationActive(
  user: AuthUser | null | undefined = getAuthenticatedUser(),
  now = new Date(),
) {
  if (!user || !user.aiBotEnabled) {
    return false
  }

  const expiresAtMs = toTimestamp(user.aiBotExpiresAt)
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= now.getTime()) {
    return false
  }

  const nextCheckpointAtMs = toTimestamp(user.aiBotNextCheckpointAt)
  if (Number.isFinite(nextCheckpointAtMs) && nextCheckpointAtMs <= now.getTime()) {
    return false
  }

  return true
}

export function isAIBotBackendSubscriptionActive(
  user: AuthUser | null | undefined = getAuthenticatedUser(),
  now = new Date(),
) {
  if (!user) {
    return false
  }

  const activatedAtMs = toTimestamp(user.aiBotActivatedAt)
  const hasActivation = Boolean(user.aiBotEnabled) || Number.isFinite(activatedAtMs)
  if (!hasActivation) {
    return false
  }

  const expiresAtMs = toTimestamp(user.aiBotExpiresAt)
  if (!Number.isFinite(expiresAtMs)) {
    // Legacy fallback: treat purchased bot without expiry as active display state.
    return true
  }

  return expiresAtMs > now.getTime()
}

export function isAIBotAutomationActiveForUser(
  user: AuthUser | null | undefined = getAuthenticatedUser(),
  now = new Date(),
) {
  return isAIBotAutomationActive(now) || isAIBotBackendAutomationActive(user, now)
}

export function isAIBotDisplayActiveForUser(
  user: AuthUser | null | undefined = getAuthenticatedUser(),
  now = new Date(),
) {
  const localState = getAIBotLocalState(now)
  const localEnabled = Boolean(localState.activatedAt) && localState.enabled
  return localEnabled || isAIBotBackendSubscriptionActive(user, now)
}
