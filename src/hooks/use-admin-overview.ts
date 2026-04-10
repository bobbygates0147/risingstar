import { useCallback, useEffect, useState } from 'react'
import { getAuthorizedHeaders, signOut } from '../lib/auth'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')

export type AdminUserRow = {
  id: string
  name: string
  email: string
  tier: string
  status: string
  role: 'user' | 'admin'
  aiBotStatus: 'Active' | 'Inactive'
  aiBotVerificationStatus: 'verified' | 'unverified' | 'rejected'
  aiBotPaymentTxHash: string
  aiBotProofUrl: string
}

export type AdminTransaction = {
  id: string
  type: string
  amount: string
  status: string
}

export type AdminWithdrawal = {
  id: string
  userName: string
  userEmail: string
  amount: number
  paymentMethod: 'crypto'
  paymentReference: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string | null
  processedAt: string | null
}

export type AdminTaskPack = {
  id: string
  userName: string
  userEmail: string
  packLabel: string
  tasks: number
  priceUsd: number
  paymentMethod: 'wallet' | 'crypto'
  paymentTxHash: string
  paymentNetwork: string
  status: 'Pending' | 'Completed' | 'Rejected'
  requestedAt: string | null
  processedAt: string | null
  proofUrl: string
}

export type AdminStats = {
  totalUsers: number
  totalTasks: number
  activeUsers: number
  totalTransactions: number
  pendingWithdrawals: number
  pendingTaskPacks?: number
}

export type AdminOverviewPayload = {
  users: AdminUserRow[]
  transactions: AdminTransaction[]
  withdrawals: AdminWithdrawal[]
  taskPacks: AdminTaskPack[]
  stats: AdminStats
}

const fallbackOverview: AdminOverviewPayload = {
  users: [],
  transactions: [],
  withdrawals: [],
  taskPacks: [],
  stats: {
    totalUsers: 0,
    totalTasks: 0,
    activeUsers: 0,
    totalTransactions: 0,
    pendingWithdrawals: 0,
    pendingTaskPacks: 0,
  },
}

function handleUnauthorized() {
  signOut()

  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isAdminUserRow(value: unknown): value is AdminUserRow {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.tier === 'string' &&
    typeof value.status === 'string' &&
    (value.role === 'user' || value.role === 'admin') &&
    (value.aiBotStatus === 'Active' || value.aiBotStatus === 'Inactive') &&
    (value.aiBotVerificationStatus === 'verified' ||
      value.aiBotVerificationStatus === 'unverified' ||
      value.aiBotVerificationStatus === 'rejected') &&
    typeof value.aiBotPaymentTxHash === 'string' &&
    typeof value.aiBotProofUrl === 'string'
  )
}

function isAdminTransaction(value: unknown): value is AdminTransaction {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.amount === 'string' &&
    typeof value.status === 'string'
  )
}

function isAdminWithdrawal(value: unknown): value is AdminWithdrawal {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.userName === 'string' &&
    typeof value.userEmail === 'string' &&
    typeof value.amount === 'number' &&
    typeof value.paymentMethod === 'string' &&
    typeof value.paymentReference === 'string' &&
    (value.status === 'pending' || value.status === 'approved' || value.status === 'rejected') &&
    (typeof value.requestedAt === 'string' || value.requestedAt === null) &&
    (typeof value.processedAt === 'string' || value.processedAt === null)
  )
}

function isAdminTaskPack(value: unknown): value is AdminTaskPack {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.userName === 'string' &&
    typeof value.userEmail === 'string' &&
    typeof value.packLabel === 'string' &&
    typeof value.tasks === 'number' &&
    typeof value.priceUsd === 'number' &&
    (value.paymentMethod === 'wallet' || value.paymentMethod === 'crypto') &&
    typeof value.paymentTxHash === 'string' &&
    typeof value.paymentNetwork === 'string' &&
    (value.status === 'Pending' || value.status === 'Completed' || value.status === 'Rejected') &&
    (typeof value.requestedAt === 'string' || value.requestedAt === null) &&
    (typeof value.processedAt === 'string' || value.processedAt === null) &&
    typeof value.proofUrl === 'string'
  )
}

function toAdminWithdrawal(value: unknown): AdminWithdrawal | null {
  if (!isAdminWithdrawal(value)) {
    return null
  }

  return {
    ...value,
    paymentMethod: 'crypto',
  }
}

function toAdminStats(value: unknown): AdminStats {
  if (!isObject(value)) {
    return fallbackOverview.stats
  }

  const totalUsers = Number(value.totalUsers ?? 0)
  const totalTasks = Number(value.totalTasks ?? 0)
  const activeUsers = Number(value.activeUsers ?? 0)
  const totalTransactions = Number(value.totalTransactions ?? 0)
  const pendingWithdrawals = Number(value.pendingWithdrawals ?? 0)
  const pendingTaskPacks = Number(value.pendingTaskPacks ?? 0)

  return {
    totalUsers: Number.isFinite(totalUsers) ? totalUsers : 0,
    totalTasks: Number.isFinite(totalTasks) ? totalTasks : 0,
    activeUsers: Number.isFinite(activeUsers) ? activeUsers : 0,
    totalTransactions: Number.isFinite(totalTransactions) ? totalTransactions : 0,
    pendingWithdrawals: Number.isFinite(pendingWithdrawals) ? pendingWithdrawals : 0,
    pendingTaskPacks: Number.isFinite(pendingTaskPacks) ? pendingTaskPacks : 0,
  }
}

function toAdminOverview(value: unknown): AdminOverviewPayload {
  if (!isObject(value)) {
    return fallbackOverview
  }

  const users = Array.isArray(value.users)
    ? value.users.filter(isAdminUserRow)
    : fallbackOverview.users

  const transactions = Array.isArray(value.transactions)
    ? value.transactions.filter(isAdminTransaction)
    : fallbackOverview.transactions

  const withdrawals = Array.isArray(value.withdrawals)
    ? value.withdrawals
        .map(toAdminWithdrawal)
        .filter((entry): entry is AdminWithdrawal => entry !== null)
    : fallbackOverview.withdrawals
  const taskPacks = Array.isArray(value.taskPacks)
    ? value.taskPacks
        .filter(isAdminTaskPack)
        .map((pack) => {
          if (pack.proofUrl && pack.proofUrl.startsWith('/')) {
            return {
              ...pack,
              proofUrl: `${API_BASE_URL}${pack.proofUrl}`,
            }
          }

          return pack
        })
    : fallbackOverview.taskPacks
  const usersWithProofs = users.map((user) => {
    if (user.aiBotProofUrl && user.aiBotProofUrl.startsWith('/')) {
      return {
        ...user,
        aiBotProofUrl: `${API_BASE_URL}${user.aiBotProofUrl}`,
      }
    }

    return user
  })

  return {
    users: usersWithProofs,
    transactions,
    withdrawals,
    taskPacks,
    stats: toAdminStats(value.stats),
  }
}

function extractMessage(value: unknown, fallback: string) {
  if (isObject(value) && typeof value.message === 'string') {
    return value.message
  }

  return fallback
}

export function useAdminOverview() {
  const [overview, setOverview] = useState<AdminOverviewPayload>(fallbackOverview)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setIsLoading(true)
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/overview`, {
        headers: {
          ...getAuthorizedHeaders(),
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
        }

        throw new Error(`Admin overview request failed: ${response.status}`)
      }

      const data = (await response.json()) as unknown
      setOverview(toAdminOverview(data))
    } catch (loadError) {
      setOverview(fallbackOverview)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin overview')
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  const processWithdrawal = useCallback(
    async (requestId: string, action: 'approve' | 'reject') => {
      setError('')
      setMessage('')
      setIsBusy(true)

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/withdrawals/${encodeURIComponent(requestId)}/${action}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthorizedHeaders(),
            },
          },
        )

        const payload = (await response.json().catch(() => ({}))) as unknown

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
          }

          throw new Error(
            extractMessage(
              payload,
              action === 'approve'
                ? 'Unable to approve withdrawal'
                : 'Unable to reject withdrawal',
            ),
          )
        }

        setMessage(
          extractMessage(
            payload,
            action === 'approve' ? 'Withdrawal approved' : 'Withdrawal rejected',
          ),
        )
        await load(true)
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : action === 'approve'
              ? 'Unable to approve withdrawal'
              : 'Unable to reject withdrawal',
        )
      } finally {
        setIsBusy(false)
      }
    },
    [load],
  )

  const processTaskPack = useCallback(
    async (purchaseId: string, action: 'approve' | 'reject') => {
      setError('')
      setMessage('')
      setIsBusy(true)

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/task-packs/${encodeURIComponent(purchaseId)}/${action}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthorizedHeaders(),
            },
          },
        )

        const payload = (await response.json().catch(() => ({}))) as unknown

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
          }

          throw new Error(
            extractMessage(
              payload,
              action === 'approve'
                ? 'Unable to approve task pack'
                : 'Unable to reject task pack',
            ),
          )
        }

        setMessage(
          extractMessage(
            payload,
            action === 'approve' ? 'Task pack approved' : 'Task pack rejected',
          ),
        )
        await load(true)
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : action === 'approve'
              ? 'Unable to approve task pack'
              : 'Unable to reject task pack',
        )
      } finally {
        setIsBusy(false)
      }
    },
    [load],
  )

  const processAIBotVerification = useCallback(
    async (userId: string, action: 'verify' | 'reject') => {
      setError('')
      setMessage('')
      setIsBusy(true)

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/ai-bot/${encodeURIComponent(userId)}/${action}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthorizedHeaders(),
            },
          },
        )

        const payload = (await response.json().catch(() => ({}))) as unknown

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
          }

          throw new Error(
            extractMessage(
              payload,
              action === 'verify'
                ? 'Unable to verify AI Bot payment'
                : 'Unable to reject AI Bot payment',
            ),
          )
        }

        setMessage(
          extractMessage(
            payload,
            action === 'verify' ? 'AI Bot payment verified' : 'AI Bot payment rejected',
          ),
        )
        await load(true)
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : action === 'verify'
              ? 'Unable to verify AI Bot payment'
              : 'Unable to reject AI Bot payment',
        )
      } finally {
        setIsBusy(false)
      }
    },
    [load],
  )

  return {
    overview,
    isLoading,
    isBusy,
    error,
    message,
    reload: () => load(true),
    approveWithdrawal: (requestId: string) => processWithdrawal(requestId, 'approve'),
    rejectWithdrawal: (requestId: string) => processWithdrawal(requestId, 'reject'),
    approveTaskPack: (purchaseId: string) => processTaskPack(purchaseId, 'approve'),
    rejectTaskPack: (purchaseId: string) => processTaskPack(purchaseId, 'reject'),
    verifyAIBot: (userId: string) => processAIBotVerification(userId, 'verify'),
    rejectAIBot: (userId: string) => processAIBotVerification(userId, 'reject'),
  }
}
