import { useCallback, useEffect, useRef, useState } from 'react'
import {
  activityFeed as fallbackActivityFeed,
  dashboardSummary as fallbackDashboardSummary,
  type ActivityEntry,
} from '../data/platform-data'
import { getAuthorizedHeaders, signOut } from '../lib/auth'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')
const TASK_COMPLETED_EVENT = 'rising-star:task-completed'
const WALLET_UPDATED_EVENT = 'rising-star:wallet-updated'
const DASHBOARD_REFRESH_INTERVAL_MS = 45_000

type DashboardSummary = typeof fallbackDashboardSummary

type DashboardPayload = {
  summary: DashboardSummary
  activity: ActivityEntry[]
}

const defaultPayload: DashboardPayload = {
  summary: fallbackDashboardSummary,
  activity: fallbackActivityFeed,
}

function handleUnauthorized() {
  signOut()

  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
}

function isActivityEntry(value: unknown): value is ActivityEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.label === 'string' &&
    (item.category === 'Music' ||
      item.category === 'Ads' ||
      item.category === 'Art' ||
      item.category === 'Social') &&
    typeof item.amount === 'number' &&
    typeof item.time === 'string' &&
    typeof item.detail === 'string'
  )
}

export function useDashboardData() {
  const [payload, setPayload] = useState<DashboardPayload>(defaultPayload)
  const [isLoading, setIsLoading] = useState(true)
  const isMountedRef = useRef(true)

  const load = useCallback(
    async (isBackgroundRefresh = false) => {
      try {
        if (!isBackgroundRefresh) {
          setIsLoading(true)
        }

        const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
          headers: {
            ...getAuthorizedHeaders(),
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
          }
          throw new Error(`Dashboard request failed: ${response.status}`)
        }

        const data = (await response.json()) as Partial<DashboardPayload>

        const summary =
          data.summary && typeof data.summary === 'object'
            ? ({
                ...fallbackDashboardSummary,
                ...data.summary,
              } as DashboardSummary)
            : fallbackDashboardSummary

        const activity = Array.isArray(data.activity)
          ? data.activity.filter(isActivityEntry)
          : fallbackActivityFeed

        if (!isMountedRef.current) {
          return
        }

        setPayload({
          summary,
          activity: activity.length > 0 ? activity : fallbackActivityFeed,
        })
      } catch {
        if (!isMountedRef.current) {
          return
        }

        setPayload(defaultPayload)
      } finally {
        if (!isBackgroundRefresh && isMountedRef.current) {
          setIsLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    isMountedRef.current = true
    let isMounted = true

    void load(false)

    function handleTaskCompleted() {
      if (!isMounted) {
        return
      }

      void load(true)
    }

    function handleWalletUpdated() {
      if (!isMounted) {
        return
      }

      void load(true)
    }

    const refreshInterval = window.setInterval(() => {
      if (!isMounted) {
        return
      }

      void load(true)
    }, DASHBOARD_REFRESH_INTERVAL_MS)

    window.addEventListener(TASK_COMPLETED_EVENT, handleTaskCompleted)
    window.addEventListener(WALLET_UPDATED_EVENT, handleWalletUpdated)

    return () => {
      isMounted = false
      isMountedRef.current = false
      window.clearInterval(refreshInterval)
      window.removeEventListener(TASK_COMPLETED_EVENT, handleTaskCompleted)
      window.removeEventListener(WALLET_UPDATED_EVENT, handleWalletUpdated)
    }
  }, [load])

  return {
    summary: payload.summary,
    activity: payload.activity,
    isLoading,
  }
}
