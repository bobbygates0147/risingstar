import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getAuthenticatedUser,
  getAuthorizedHeaders,
  signOut,
  type AuthUser,
} from '../lib/auth'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')

type ReferralRewardStatus = 'locked' | 'active' | 'unlocked'

export type ReferralStats = {
  totalReferrals: number
  qualifiedReferrals: number
  earnedRewards: number
  nextMilestoneTarget: number | null
  nextMilestoneRemaining: number
  nextRewardLabel: string
  projectedCashoutUsd: number
}

export type ReferralReward = {
  id: string
  label: string
  target: number
  giftItem: string
  priceRange: string
  cashBonusUsd: number
  badge: string
  progress: number
  remaining: number
  status: ReferralRewardStatus
}

export type ReferralMember = {
  id: string
  name: string
  tier: string
  joinedAt: string | null
  joinedLabel: string
  status: 'Qualified' | 'Pending'
}

export type ReferralPayload = {
  code: string
  stats: ReferralStats
  rewards: ReferralReward[]
  referrals: ReferralMember[]
}

const fallbackRewards: ReferralReward[] = [
  {
    id: 'tier1',
    label: 'Tier 1',
    target: 5,
    giftItem: 'Fast charger',
    priceRange: 'Low-cost / everyday',
    cashBonusUsd: 10,
    badge: 'Starter Gadget',
    progress: 0,
    remaining: 5,
    status: 'active',
  },
  {
    id: 'tier2',
    label: 'Tier 2',
    target: 10,
    giftItem: 'Wireless earpiece',
    priceRange: 'Mid-value / lifestyle',
    cashBonusUsd: 35,
    badge: 'Power Circle',
    progress: 0,
    remaining: 15,
    status: 'locked',
  },
  {
    id: 'tier3',
    label: 'Tier 3',
    target: 20,
    giftItem: 'Air fryer',
    priceRange: 'High-value / premium',
    cashBonusUsd: 75,
    badge: 'Elite Crew',
    progress: 0,
    remaining: 30,
    status: 'locked',
  },
  {
    id: 'tier4',
    label: 'Tier 4',
    target: 50,
    giftItem: 'Premium smartphone bundle',
    priceRange: 'Luxury / flagship',
    cashBonusUsd: 150,
    badge: 'Star Partner',
    progress: 0,
    remaining: 50,
    status: 'locked',
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

function normalizeReferralCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 24)
}

function buildFallbackCode(user: AuthUser | null) {
  const existingCode = normalizeReferralCode(user?.referralCode || '')

  if (existingCode) {
    return existingCode
  }

  const namePart = normalizeReferralCode(user?.name || user?.email || 'STAR').slice(0, 6)
  const idPart = normalizeReferralCode(user?.id || '').slice(-6)

  return `${namePart || 'STAR'}${idPart || '000001'}`
}

function buildFallbackPayload(user: AuthUser | null): ReferralPayload {
  return {
    code: buildFallbackCode(user),
    stats: {
      totalReferrals: 0,
      qualifiedReferrals: 0,
      earnedRewards: 0,
      nextMilestoneTarget: 5,
      nextMilestoneRemaining: 5,
      nextRewardLabel: 'USB-C fast charger kit',
      projectedCashoutUsd: 0,
    },
    rewards: fallbackRewards,
    referrals: [],
  }
}

function isRewardStatus(value: unknown): value is ReferralRewardStatus {
  return value === 'locked' || value === 'active' || value === 'unlocked'
}

function toReferralStats(value: unknown, fallback: ReferralStats): ReferralStats {
  if (!value || typeof value !== 'object') {
    return fallback
  }

  const source = value as Partial<ReferralStats>
  const nextMilestoneTarget =
    source.nextMilestoneTarget === null
      ? null
      : Math.max(1, Math.floor(readNumber(source.nextMilestoneTarget, fallback.nextMilestoneTarget ?? 5)))

  return {
    totalReferrals: Math.max(0, Math.floor(readNumber(source.totalReferrals, fallback.totalReferrals))),
    qualifiedReferrals: Math.max(
      0,
      Math.floor(readNumber(source.qualifiedReferrals, fallback.qualifiedReferrals)),
    ),
    earnedRewards: Math.max(0, Math.floor(readNumber(source.earnedRewards, fallback.earnedRewards))),
    nextMilestoneTarget,
    nextMilestoneRemaining: Math.max(
      0,
      Math.floor(readNumber(source.nextMilestoneRemaining, fallback.nextMilestoneRemaining)),
    ),
    nextRewardLabel: readString(source.nextRewardLabel, fallback.nextRewardLabel),
    projectedCashoutUsd: Number(readNumber(source.projectedCashoutUsd, fallback.projectedCashoutUsd).toFixed(2)),
  }
}

function toRewards(value: unknown, fallback: ReferralReward[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const rewards = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as Record<string, unknown>
      const status = isRewardStatus(source.status) ? source.status : 'locked'
      const target = Math.max(1, Math.floor(readNumber(source.target, 1)))

      return {
        id: readString(source.id),
        label: readString(source.label),
        target,
        giftItem: readString(source.giftItem),
        priceRange: readString(source.priceRange),
        cashBonusUsd: Number(readNumber(source.cashBonusUsd).toFixed(2)),
        badge: readString(source.badge),
        progress: Math.min(100, Math.max(0, Math.floor(readNumber(source.progress)))),
        remaining: Math.max(0, Math.floor(readNumber(source.remaining))),
        status,
      } satisfies ReferralReward
    })
    .filter((item): item is ReferralReward => Boolean(item?.id && item.giftItem))

  return rewards.length > 0 ? rewards : fallback
}

function toReferrals(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as Record<string, unknown>
      const status = source.status === 'Qualified' ? 'Qualified' : 'Pending'
      const joinedAt = typeof source.joinedAt === 'string' ? source.joinedAt : null

      return {
        id: readString(source.id),
        name: readString(source.name, 'Rising Star Member'),
        tier: readString(source.tier, 'Tier 1'),
        joinedAt,
        joinedLabel: readString(source.joinedLabel, 'Recently'),
        status,
      } satisfies ReferralMember
    })
    .filter((item): item is ReferralMember => Boolean(item?.id))
}

function toReferralPayload(value: unknown, fallback: ReferralPayload): ReferralPayload {
  if (!value || typeof value !== 'object') {
    return fallback
  }

  const source = value as Record<string, unknown>

  return {
    code: normalizeReferralCode(readString(source.code, fallback.code)) || fallback.code,
    stats: toReferralStats(source.stats, fallback.stats),
    rewards: toRewards(source.rewards, fallback.rewards),
    referrals: toReferrals(source.referrals),
  }
}

export function useReferralData() {
  const fallback = useMemo(() => buildFallbackPayload(getAuthenticatedUser()), [])
  const [data, setData] = useState<ReferralPayload>(fallback)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch(`${API_BASE_URL}/api/referrals`, {
        headers: {
          ...getAuthorizedHeaders(),
        },
      })

      const payload = (await response.json().catch(() => ({}))) as unknown

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
        }

        throw new Error('Referral data is not available right now')
      }

      setData(toReferralPayload(payload, fallback))
    } catch (loadError) {
      setData(fallback)
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Referral data is not available right now',
      )
    } finally {
      setIsLoading(false)
    }
  }, [fallback])

  useEffect(() => {
    let mounted = true

    async function load() {
      await reload()

      if (!mounted) {
        return
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [reload])

  return {
    ...data,
    error,
    isLoading,
    reload,
  }
}
