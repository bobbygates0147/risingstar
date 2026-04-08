import { useCallback, useEffect, useState } from 'react'
import {
  activateAIBotLocalState,
  AI_BOT_DEFAULT_CHECKPOINT_INTERVAL_MINUTES,
  AI_BOT_DEFAULT_FEE_USD,
  completeAIBotLocalCheckpoint,
  getAIBotLocalState,
  setAIBotLocalEnabled,
} from '../lib/ai-bot-state'
import { getAuthorizedHeaders, refreshAuthenticatedUser, signOut } from '../lib/auth'
import { getDefaultCryptoWalletInstructions } from '../lib/crypto-wallets'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')

type PaymentMethod = 'crypto' | 'wallet'

export type AIBotConfig = {
  currency: 'USD'
  aiBotFeeUsd: number
  subscriptionMonths: number
  paymentMethods: PaymentMethod[]
  checkpointIntervalMinutes: number
  dailyMaxRuns: number
  paymentInstructions: {
    crypto: {
      btcAddress: string
      ethAddress: string
      usdtTrc20Address: string
      usdtErc20Address: string
      usdtBep20Address: string
      solAddress: string
    }
  }
}

export type AIBotStatus = {
  enabled: boolean
  feeUsd: number
  paymentMethod: string
  activatedAt: string | null
  subscription: {
    months: number
    active: boolean
    expired: boolean
    expiresAt: string | null
    remainingDays: number
  }
  checkpoint: {
    required: boolean
    lastCheckpointAt: string | null
    nextCheckpointAt: string | null
    intervalMinutes: number
  }
  usage: {
    count: number
    max: number
    percent: number
    remaining: number
  }
}

type ActivatePayload = {
  paymentMethod: PaymentMethod
  paymentReference: string
  paymentAmountUsd: number
}

const fallbackConfig: AIBotConfig = {
  currency: 'USD',
  aiBotFeeUsd: AI_BOT_DEFAULT_FEE_USD,
  subscriptionMonths: 1,
  paymentMethods: ['crypto'],
  checkpointIntervalMinutes: AI_BOT_DEFAULT_CHECKPOINT_INTERVAL_MINUTES,
  dailyMaxRuns: 0,
  paymentInstructions: {
    crypto: getDefaultCryptoWalletInstructions(),
  },
}

function localStateToStatus(): AIBotStatus {
  const local = getAIBotLocalState()
  const activatedAtDate = local.activatedAt ? new Date(local.activatedAt) : null
  const fallbackExpiresAt =
    activatedAtDate && Number.isFinite(activatedAtDate.getTime())
      ? (() => {
          const next = new Date(activatedAtDate)
          next.setMonth(next.getMonth() + fallbackConfig.subscriptionMonths)
          return next.toISOString()
        })()
      : null

  return {
    enabled: Boolean(local.activatedAt) && local.enabled,
    feeUsd: local.feeUsd,
    paymentMethod: local.paymentMethod,
    activatedAt: local.activatedAt,
    subscription: {
      months: fallbackConfig.subscriptionMonths,
      active: Boolean(local.activatedAt) && local.enabled,
      expired: false,
      expiresAt: fallbackExpiresAt,
      remainingDays: 0,
    },
    checkpoint: {
      required: local.checkpointRequired,
      lastCheckpointAt: local.lastCheckpointAt,
      nextCheckpointAt: local.nextCheckpointAt,
      intervalMinutes: local.checkpointIntervalMinutes,
    },
    usage: {
      count: 0,
      max: 0,
      percent: 0,
      remaining: 0,
    },
  }
}

const fallbackStatus: AIBotStatus = localStateToStatus()

function handleUnauthorized() {
  signOut()

  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
}

function extractErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message
  }

  return fallback
}

async function parseJson<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as T
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'crypto' || value === 'wallet'
}

function toConfig(value: unknown): AIBotConfig {
  if (!value || typeof value !== 'object') {
    return fallbackConfig
  }

  const payload = value as Partial<AIBotConfig>

  const paymentMethods = Array.isArray(payload.paymentMethods)
    ? payload.paymentMethods.filter(isPaymentMethod)
    : fallbackConfig.paymentMethods

  const fallbackInstructions = fallbackConfig.paymentInstructions.crypto
  const sourceCrypto =
    payload.paymentInstructions &&
    typeof payload.paymentInstructions === 'object' &&
    'crypto' in payload.paymentInstructions
      ? (payload.paymentInstructions.crypto as Partial<AIBotConfig['paymentInstructions']['crypto']>)
      : undefined

  return {
    currency: 'USD',
    aiBotFeeUsd:
      typeof payload.aiBotFeeUsd === 'number'
        ? payload.aiBotFeeUsd
        : fallbackConfig.aiBotFeeUsd,
    subscriptionMonths:
      typeof payload.subscriptionMonths === 'number' &&
      Number.isFinite(payload.subscriptionMonths) &&
      payload.subscriptionMonths > 0
        ? Math.floor(payload.subscriptionMonths)
        : fallbackConfig.subscriptionMonths,
    paymentMethods:
      paymentMethods.length > 0 ? paymentMethods : fallbackConfig.paymentMethods,
    checkpointIntervalMinutes:
      typeof payload.checkpointIntervalMinutes === 'number'
        ? payload.checkpointIntervalMinutes
        : fallbackConfig.checkpointIntervalMinutes,
    dailyMaxRuns: 0,
    paymentInstructions: {
      crypto: {
        btcAddress:
          typeof sourceCrypto?.btcAddress === 'string' && sourceCrypto.btcAddress.trim().length > 0
            ? sourceCrypto.btcAddress
            : fallbackInstructions.btcAddress,
        ethAddress:
          typeof sourceCrypto?.ethAddress === 'string' && sourceCrypto.ethAddress.trim().length > 0
            ? sourceCrypto.ethAddress
            : fallbackInstructions.ethAddress,
        usdtTrc20Address:
          typeof sourceCrypto?.usdtTrc20Address === 'string' &&
          sourceCrypto.usdtTrc20Address.trim().length > 0
            ? sourceCrypto.usdtTrc20Address
            : fallbackInstructions.usdtTrc20Address,
        usdtErc20Address:
          typeof sourceCrypto?.usdtErc20Address === 'string' &&
          sourceCrypto.usdtErc20Address.trim().length > 0
            ? sourceCrypto.usdtErc20Address
            : fallbackInstructions.usdtErc20Address,
        usdtBep20Address:
          typeof sourceCrypto?.usdtBep20Address === 'string' &&
          sourceCrypto.usdtBep20Address.trim().length > 0
            ? sourceCrypto.usdtBep20Address
            : fallbackInstructions.usdtBep20Address,
        solAddress:
          typeof sourceCrypto?.solAddress === 'string' && sourceCrypto.solAddress.trim().length > 0
            ? sourceCrypto.solAddress
            : fallbackInstructions.solAddress,
      },
    },
  }
}

function toStatus(value: unknown): AIBotStatus {
  if (!value || typeof value !== 'object') {
    return localStateToStatus()
  }

  const payload = value as Partial<AIBotStatus>
  const checkpoint = payload.checkpoint
  const subscription = payload.subscription
  const usage = payload.usage

  return {
    enabled: Boolean(payload.enabled),
    feeUsd: typeof payload.feeUsd === 'number' ? payload.feeUsd : fallbackStatus.feeUsd,
    paymentMethod: typeof payload.paymentMethod === 'string' ? payload.paymentMethod : '',
    activatedAt:
      typeof payload.activatedAt === 'string' || payload.activatedAt === null
        ? payload.activatedAt
        : null,
    subscription: {
      months:
        typeof subscription?.months === 'number' && Number.isFinite(subscription.months)
          ? Math.max(1, Math.floor(subscription.months))
          : fallbackConfig.subscriptionMonths,
      active: Boolean(subscription?.active),
      expired: Boolean(subscription?.expired),
      expiresAt:
        typeof subscription?.expiresAt === 'string' || subscription?.expiresAt === null
          ? subscription.expiresAt
          : null,
      remainingDays:
        typeof subscription?.remainingDays === 'number' && Number.isFinite(subscription.remainingDays)
          ? Math.max(0, Math.floor(subscription.remainingDays))
          : 0,
    },
    checkpoint: {
      required: Boolean(checkpoint?.required),
      lastCheckpointAt:
        typeof checkpoint?.lastCheckpointAt === 'string' || checkpoint?.lastCheckpointAt === null
          ? checkpoint.lastCheckpointAt
          : null,
      nextCheckpointAt:
        typeof checkpoint?.nextCheckpointAt === 'string' || checkpoint?.nextCheckpointAt === null
          ? checkpoint.nextCheckpointAt
          : null,
      intervalMinutes:
        typeof checkpoint?.intervalMinutes === 'number'
          ? checkpoint.intervalMinutes
          : fallbackConfig.checkpointIntervalMinutes,
    },
    usage: {
      count:
        typeof usage?.count === 'number' && Number.isFinite(usage.count)
          ? Math.max(0, Math.floor(usage.count))
          : 0,
      max:
        typeof usage?.max === 'number' && Number.isFinite(usage.max)
          ? Math.max(0, Math.floor(usage.max))
          : 0,
      percent:
        typeof usage?.percent === 'number' && Number.isFinite(usage.percent)
          ? Math.max(0, Math.min(100, Math.floor(usage.percent)))
          : 0,
      remaining:
        typeof usage?.remaining === 'number' && Number.isFinite(usage.remaining)
          ? Math.max(0, Math.floor(usage.remaining))
          : 0,
    },
  }
}

export function useAIBot() {
  const [config, setConfig] = useState<AIBotConfig>(fallbackConfig)
  const [status, setStatus] = useState<AIBotStatus>(fallbackStatus)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLocalMode, setIsLocalMode] = useState(false)

  const reload = useCallback(async () => {
    try {
      const [configRes, statusRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/ai-bot/config`, {
          headers: {
            ...getAuthorizedHeaders(),
          },
        }),
        fetch(`${API_BASE_URL}/api/ai-bot/status`, {
          headers: {
            ...getAuthorizedHeaders(),
          },
        }),
      ])

      if (!configRes.ok || !statusRes.ok) {
        if (configRes.status === 401 || statusRes.status === 401) {
          handleUnauthorized()
        }
        throw new Error('Unable to load AI Bot data')
      }

      const [configData, statusData] = await Promise.all([
        parseJson<unknown>(configRes),
        parseJson<unknown>(statusRes),
      ])

      setConfig(toConfig(configData))
      setStatus(toStatus(statusData))
      setIsLocalMode(false)
    } catch {
      const local = localStateToStatus()
      setConfig((previous) => ({
        ...fallbackConfig,
        aiBotFeeUsd: local.feeUsd || previous.aiBotFeeUsd,
        subscriptionMonths: previous.subscriptionMonths || fallbackConfig.subscriptionMonths,
        checkpointIntervalMinutes:
          local.checkpoint.intervalMinutes || previous.checkpointIntervalMinutes,
      }))
      setStatus(local)
      setIsLocalMode(true)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        await reload()
      } catch (loadError) {
        if (isMounted) {
          const msg =
            loadError instanceof Error ? loadError.message : 'Unable to load AI Bot state'
          setError(msg)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [reload])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!isLocalMode) {
        return
      }

      setStatus(localStateToStatus())
    }, 60_000)

    return () => {
      window.clearInterval(interval)
    }
  }, [isLocalMode])

  const activate = useCallback(
    async (payload: ActivatePayload) => {
      setError('')
      setMessage('')
      setIsBusy(true)

      try {
        const response = await fetch(`${API_BASE_URL}/api/ai-bot/activate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthorizedHeaders(),
          },
          body: JSON.stringify(payload),
        })

        const data = await parseJson<{
          message?: string
          status?: AIBotStatus
        }>(response)

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
          }
          throw new Error(extractErrorMessage(data, 'Unable to activate AI Bot'))
        }

        if (data.status) {
          setStatus(toStatus(data.status))
        } else {
          await reload()
        }

        await refreshAuthenticatedUser()
        setMessage(data.message || 'AI Bot activated')
        setIsLocalMode(false)
      } catch {
        const local = activateAIBotLocalState({
          paymentMethod: payload.paymentMethod,
          feeUsd: payload.paymentAmountUsd,
        })

        setStatus(localStateToStatus())
        setConfig((previous) => ({
          ...previous,
          aiBotFeeUsd: local.feeUsd,
          subscriptionMonths: previous.subscriptionMonths || fallbackConfig.subscriptionMonths,
          checkpointIntervalMinutes: local.checkpointIntervalMinutes,
        }))
        setMessage('AI Bot activated in auto mode')
        setIsLocalMode(true)
      } finally {
        setIsBusy(false)
      }
    },
    [reload],
  )

  const completeCheckpoint = useCallback(async () => {
    setError('')
    setMessage('')
    setIsBusy(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-bot/checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
      })

      const data = await parseJson<{ message?: string; status?: AIBotStatus }>(response)

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
        }
        throw new Error(extractErrorMessage(data, 'Unable to complete checkpoint'))
      }

      if (data.status) {
        setStatus(toStatus(data.status))
      } else {
        await reload()
      }

      await refreshAuthenticatedUser()
      setMessage(data.message || 'Checkpoint completed')
      setIsLocalMode(false)
    } catch {
      completeAIBotLocalCheckpoint()
      setStatus(localStateToStatus())
      setMessage('Checkpoint completed')
      setIsLocalMode(true)
    } finally {
      setIsBusy(false)
    }
  }, [reload])

  const toggleAutomation = useCallback(
    async (enabled: boolean) => {
      setError('')
      setMessage('')
      setIsBusy(true)

      try {
        const response = await fetch(`${API_BASE_URL}/api/ai-bot/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthorizedHeaders(),
          },
          body: JSON.stringify({ enabled }),
        })

        const data = await parseJson<{ message?: string; status?: AIBotStatus }>(response)

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
          }
          throw new Error(extractErrorMessage(data, 'Unable to toggle AI Bot'))
        }

        if (data.status) {
          setStatus(toStatus(data.status))
        } else {
          await reload()
        }

        await refreshAuthenticatedUser()
        setMessage(data.message || (enabled ? 'Auto mode enabled' : 'Auto mode paused'))
        setIsLocalMode(false)
      } catch {
        setAIBotLocalEnabled(enabled)
        setStatus(localStateToStatus())
        setMessage(enabled ? 'Auto mode enabled' : 'Auto mode paused')
        setIsLocalMode(true)
      } finally {
        setIsBusy(false)
      }
    },
    [reload],
  )

  const runDailyAutomation = useCallback(async () => {
    setError('')
    setMessage('Auto mode runs continuously while enabled.')
  }, [])

  return {
    config,
    status,
    isLoading,
    isBusy,
    error,
    message,
    isLocalMode,
    activate,
    completeCheckpoint,
    toggleAutomation,
    runDailyAutomation,
    reload,
  }
}

