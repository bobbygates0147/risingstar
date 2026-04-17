import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAuthorizedHeaders, signOut } from '../lib/auth'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')
const FALLBACK_REFRESH_INTERVAL_MS = 15_000

export type WithdrawalLeaderboardEntry = {
  id: string
  rank: number
  source: 'live' | 'seeded'
  sourceUserId: string
  name: string
  country: string
  tier: string
  totalWithdrawnUsd: number
  withdrawalCount: number
  biggestWithdrawalUsd: number
  lastWithdrawalAt: string | null
  lastWithdrawalLabel: string
  badge: string
  isCurrentUser: boolean
}

export type WithdrawalLeaderboardStats = {
  rankedUsers: number
  liveUsers: number
  liveTotalWithdrawnUsd: number
  highestWithdrawalUsd: number
  minimumWithdrawalUsd: number
  currentUserEligible: boolean
  currentUserRank: number | null
  currentUserWithdrawnUsd: number
}

export type WithdrawalLeaderboardPayload = {
  updatedAt: string
  refreshIntervalMs: number
  stats: WithdrawalLeaderboardStats
  entries: WithdrawalLeaderboardEntry[]
}

const fallbackEntries: WithdrawalLeaderboardEntry[] = [
  {
    id: 'dummy-maya',
    rank: 1,
    source: 'seeded',
    sourceUserId: '',
    name: 'Maya Holt',
    country: 'United States',
    tier: 'Tier 3',
    totalWithdrawnUsd: 7840,
    withdrawalCount: 16,
    biggestWithdrawalUsd: 1250,
    lastWithdrawalAt: null,
    lastWithdrawalLabel: '2h ago',
    badge: 'Top Cashout',
    isCurrentUser: false,
  },
  {
    id: 'dummy-korede',
    rank: 2,
    source: 'seeded',
    sourceUserId: '',
    name: 'Korede Miles',
    country: 'Nigeria',
    tier: 'Tier 3',
    totalWithdrawnUsd: 6425,
    withdrawalCount: 14,
    biggestWithdrawalUsd: 980,
    lastWithdrawalAt: null,
    lastWithdrawalLabel: '5h ago',
    badge: 'Fast Payouts',
    isCurrentUser: false,
  },
  {
    id: 'dummy-rina',
    rank: 3,
    source: 'seeded',
    sourceUserId: '',
    name: 'Rina Banks',
    country: 'United Kingdom',
    tier: 'Tier 2',
    totalWithdrawnUsd: 4180,
    withdrawalCount: 11,
    biggestWithdrawalUsd: 720,
    lastWithdrawalAt: null,
    lastWithdrawalLabel: '10h ago',
    badge: 'Clean Run',
    isCurrentUser: false,
  },
  {
    id: 'dummy-zane',
    rank: 4,
    source: 'seeded',
    sourceUserId: '',
    name: 'Zane Carter',
    country: 'Canada',
    tier: 'Tier 2',
    totalWithdrawnUsd: 2895,
    withdrawalCount: 8,
    biggestWithdrawalUsd: 640,
    lastWithdrawalAt: null,
    lastWithdrawalLabel: '18h ago',
    badge: 'Weekly Climber',
    isCurrentUser: false,
  },
  {
    id: 'dummy-amara',
    rank: 5,
    source: 'seeded',
    sourceUserId: '',
    name: 'Amara Lee',
    country: 'Ghana',
    tier: 'Tier 1',
    totalWithdrawnUsd: 1720,
    withdrawalCount: 6,
    biggestWithdrawalUsd: 420,
    lastWithdrawalAt: null,
    lastWithdrawalLabel: 'Yesterday',
    badge: 'Rising Cashout',
    isCurrentUser: false,
  },
]

function handleUnauthorized() {
  signOut()

  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function isLeaderboardSource(value: unknown): value is WithdrawalLeaderboardEntry['source'] {
  return value === 'live' || value === 'seeded'
}

function buildFallbackPayload(): WithdrawalLeaderboardPayload {
  const highestWithdrawalUsd = fallbackEntries.reduce(
    (highest, entry) => Math.max(highest, entry.biggestWithdrawalUsd),
    0,
  )

  return {
    updatedAt: new Date().toISOString(),
    refreshIntervalMs: FALLBACK_REFRESH_INTERVAL_MS,
    stats: {
      rankedUsers: fallbackEntries.length,
      liveUsers: 0,
      liveTotalWithdrawnUsd: 0,
      highestWithdrawalUsd,
      minimumWithdrawalUsd: 500,
      currentUserEligible: false,
      currentUserRank: null,
      currentUserWithdrawnUsd: 0,
    },
    entries: fallbackEntries,
  }
}

function toStats(value: unknown, fallback: WithdrawalLeaderboardStats): WithdrawalLeaderboardStats {
  if (!value || typeof value !== 'object') {
    return fallback
  }

  const source = value as Partial<WithdrawalLeaderboardStats>

  return {
    rankedUsers: Math.max(0, Math.floor(readNumber(source.rankedUsers, fallback.rankedUsers))),
    liveUsers: Math.max(0, Math.floor(readNumber(source.liveUsers, fallback.liveUsers))),
    liveTotalWithdrawnUsd: Number(
      readNumber(source.liveTotalWithdrawnUsd, fallback.liveTotalWithdrawnUsd).toFixed(2),
    ),
    highestWithdrawalUsd: Number(
      readNumber(source.highestWithdrawalUsd, fallback.highestWithdrawalUsd).toFixed(2),
    ),
    minimumWithdrawalUsd: Number(
      readNumber(source.minimumWithdrawalUsd, fallback.minimumWithdrawalUsd).toFixed(2),
    ),
    currentUserEligible: readBoolean(source.currentUserEligible, fallback.currentUserEligible),
    currentUserRank:
      source.currentUserRank === null
        ? null
        : Math.max(1, Math.floor(readNumber(source.currentUserRank, fallback.currentUserRank ?? 1))),
    currentUserWithdrawnUsd: Number(
      readNumber(source.currentUserWithdrawnUsd, fallback.currentUserWithdrawnUsd).toFixed(2),
    ),
  }
}

function toEntries(value: unknown, fallback: WithdrawalLeaderboardEntry[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const entries = value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as Record<string, unknown>
      const lastWithdrawalAt =
        typeof source.lastWithdrawalAt === 'string' ? source.lastWithdrawalAt : null

      return {
        id: readString(source.id),
        rank: Math.max(1, Math.floor(readNumber(source.rank, index + 1))),
        source: isLeaderboardSource(source.source) ? source.source : 'seeded',
        sourceUserId: readString(source.sourceUserId),
        name: readString(source.name, 'Rising Star Member'),
        country: readString(source.country, ''),
        tier: readString(source.tier, 'Tier 1'),
        totalWithdrawnUsd: Number(readNumber(source.totalWithdrawnUsd).toFixed(2)),
        withdrawalCount: Math.max(0, Math.floor(readNumber(source.withdrawalCount))),
        biggestWithdrawalUsd: Number(readNumber(source.biggestWithdrawalUsd).toFixed(2)),
        lastWithdrawalAt,
        lastWithdrawalLabel: readString(source.lastWithdrawalLabel, 'Recently'),
        badge: readString(source.badge, 'Top Withdrawal'),
        isCurrentUser: readBoolean(source.isCurrentUser),
      } satisfies WithdrawalLeaderboardEntry
    })
    .filter((entry): entry is WithdrawalLeaderboardEntry => Boolean(entry?.id))

  return entries.length > 0 ? entries : fallback
}

function toPayload(value: unknown, fallback: WithdrawalLeaderboardPayload) {
  if (!value || typeof value !== 'object') {
    return fallback
  }

  const source = value as Record<string, unknown>
  const refreshIntervalMs = Math.max(
    5_000,
    Math.floor(readNumber(source.refreshIntervalMs, fallback.refreshIntervalMs)),
  )

  return {
    updatedAt: readString(source.updatedAt, fallback.updatedAt),
    refreshIntervalMs,
    stats: toStats(source.stats, fallback.stats),
    entries: toEntries(source.entries, fallback.entries),
  } satisfies WithdrawalLeaderboardPayload
}

export function useWithdrawalLeaderboardData() {
  const fallback = useMemo(() => buildFallbackPayload(), [])
  const [data, setData] = useState<WithdrawalLeaderboardPayload>(fallback)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const mountedRef = useRef(true)

  const load = useCallback(
    async (isBackgroundRefresh = false) => {
      try {
        if (!isBackgroundRefresh) {
          setIsLoading(true)
        }
        setError('')

        const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
          headers: {
            ...getAuthorizedHeaders(),
          },
        })

        const payload = (await response.json().catch(() => ({}))) as unknown

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
          }

          throw new Error('Withdrawal leaderboard is not available right now')
        }

        if (!mountedRef.current) {
          return
        }

        setData(toPayload(payload, fallback))
      } catch (loadError) {
        if (!mountedRef.current) {
          return
        }

        setData(fallback)
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Withdrawal leaderboard is not available right now',
        )
      } finally {
        if (!isBackgroundRefresh && mountedRef.current) {
          setIsLoading(false)
        }
      }
    },
    [fallback],
  )

  useEffect(() => {
    mountedRef.current = true
    void load(false)

    return () => {
      mountedRef.current = false
    }
  }, [load])

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void load(true)
    }, data.refreshIntervalMs)

    return () => {
      window.clearInterval(refreshTimer)
    }
  }, [data.refreshIntervalMs, load])

  return {
    ...data,
    error,
    isLoading,
    reload: () => load(false),
  }
}
