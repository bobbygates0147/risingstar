import { useCallback, useEffect, useRef, useState } from 'react'
import { getAuthorizedHeaders, signOut } from '../lib/auth'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')
const TASK_COMPLETED_EVENT = 'rising-star:task-completed'
const ACTIVITY_REFRESH_INTERVAL_MS = 45_000

export type ActivityLogFilter = 'All' | 'Earnings' | 'Tasks' | 'Withdrawals'
export type ActivityLogCategory = Exclude<ActivityLogFilter, 'All'>
export type ActivityLogKind =
  | 'music'
  | 'ads'
  | 'art'
  | 'social'
  | 'milestone'
  | 'bonus'
  | 'withdrawal'

export type ActivityLogEntry = {
  id: string
  amount: number
  category: ActivityLogCategory
  dateLabel: string
  detail: string
  kind: ActivityLogKind
  timeLabel: string
  title: string
}

const fallbackActivityLog: ActivityLogEntry[] = []

function handleUnauthorized() {
  signOut()

  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
}

function isActivityLogCategory(value: unknown): value is ActivityLogCategory {
  return value === 'Earnings' || value === 'Tasks' || value === 'Withdrawals'
}

function isActivityLogKind(value: unknown): value is ActivityLogKind {
  return (
    value === 'music' ||
    value === 'ads' ||
    value === 'art' ||
    value === 'social' ||
    value === 'milestone' ||
    value === 'bonus' ||
    value === 'withdrawal'
  )
}

function toActivityEntry(value: unknown): ActivityLogEntry | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const item = value as Record<string, unknown>

  if (
    typeof item.id !== 'string' ||
    typeof item.title !== 'string' ||
    typeof item.detail !== 'string' ||
    typeof item.amount !== 'number' ||
    !isActivityLogCategory(item.category) ||
    typeof item.dateLabel !== 'string' ||
    typeof item.timeLabel !== 'string' ||
    !isActivityLogKind(item.kind)
  ) {
    return null
  }

  return {
    id: item.id,
    title: item.title,
    detail: item.detail,
    amount: item.amount,
    category: item.category,
    dateLabel: item.dateLabel,
    timeLabel: item.timeLabel,
    kind: item.kind,
  }
}

export function useActivityLog() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>(fallbackActivityLog)
  const [isLoading, setIsLoading] = useState(true)
  const isMountedRef = useRef(true)

  const load = useCallback(
    async (isBackgroundRefresh = false) => {
      try {
        if (!isBackgroundRefresh) {
          setIsLoading(true)
        }

        const response = await fetch(`${API_BASE_URL}/api/activity/log`, {
          headers: {
            ...getAuthorizedHeaders(),
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
          }

          throw new Error(`Activity request failed: ${response.status}`)
        }

        const data = (await response.json()) as unknown
        const parsed = Array.isArray(data)
          ? data.map(toActivityEntry).filter(Boolean)
          : []

        if (!isMountedRef.current) {
          return
        }

        setEntries(parsed.length > 0 ? (parsed as ActivityLogEntry[]) : fallbackActivityLog)
      } catch {
        if (!isMountedRef.current) {
          return
        }

        setEntries(fallbackActivityLog)
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

    const refreshInterval = window.setInterval(() => {
      if (!isMounted) {
        return
      }

      void load(true)
    }, ACTIVITY_REFRESH_INTERVAL_MS)

    window.addEventListener(TASK_COMPLETED_EVENT, handleTaskCompleted)

    return () => {
      isMounted = false
      isMountedRef.current = false
      window.clearInterval(refreshInterval)
      window.removeEventListener(TASK_COMPLETED_EVENT, handleTaskCompleted)
    }
  }, [load])

  return {
    entries,
    isLoading,
  }
}
