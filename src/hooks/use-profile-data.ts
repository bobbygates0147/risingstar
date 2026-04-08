import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getAuthenticatedUser,
  getAuthorizedHeaders,
  refreshAuthenticatedUser,
  signOut,
  type AuthUser,
} from '../lib/auth'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024

export type ProfileNotificationSettings = {
  taskAlerts: boolean
  securityAlerts: boolean
  payoutAlerts: boolean
  marketing: boolean
}

export type ProfileData = {
  id: string
  name: string
  email: string
  phone: string
  country: string
  bio: string
  language: string
  timezone: string
  avatarUrl: string
  tier: string
  aiBotEnabled: boolean
  createdAt: string | null
  notificationSettings: ProfileNotificationSettings
}

export type ProfileStats = {
  totalEarnings: number
  tasksCompleted: number
  daysActive: number
}

type ProfileResponsePayload = {
  user?: unknown
  stats?: unknown
  message?: string
}

type ProfileUpdatePayload = {
  name?: string
  phone?: string
  country?: string
  bio?: string
  language?: string
  timezone?: string
  notificationSettings?: Partial<ProfileNotificationSettings>
}

type PasswordPayload = {
  currentPassword: string
  newPassword: string
}

type AvatarUploadPayload = {
  imageDataUrl: string
  fileName: string
}

type TierUpgradePayload = {
  tier: 'tier1' | 'tier2' | 'tier3'
  paymentMethod: 'crypto'
  paymentReference: string
  paymentAmountUsd: number
}

const DEFAULT_NOTIFICATION_SETTINGS: ProfileNotificationSettings = {
  taskAlerts: true,
  securityAlerts: true,
  payoutAlerts: true,
  marketing: false,
}

const DEFAULT_STATS: ProfileStats = {
  totalEarnings: 0,
  tasksCompleted: 0,
  daysActive: 1,
}

function handleUnauthorized() {
  signOut()

  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function resolveApiMediaUrl(value?: string | null) {
  if (!value || typeof value !== 'string') {
    return ''
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

function normalizeNotificationSettings(value: unknown): ProfileNotificationSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_NOTIFICATION_SETTINGS
  }

  const settings = value as Partial<ProfileNotificationSettings>

  return {
    taskAlerts: readBoolean(settings.taskAlerts, DEFAULT_NOTIFICATION_SETTINGS.taskAlerts),
    securityAlerts: readBoolean(
      settings.securityAlerts,
      DEFAULT_NOTIFICATION_SETTINGS.securityAlerts,
    ),
    payoutAlerts: readBoolean(settings.payoutAlerts, DEFAULT_NOTIFICATION_SETTINGS.payoutAlerts),
    marketing: readBoolean(settings.marketing, DEFAULT_NOTIFICATION_SETTINGS.marketing),
  }
}

function buildFallbackProfile(user: AuthUser | null): ProfileData {
  return {
    id: user?.id || 'user',
    name: user?.name || 'Rising Star User',
    email: user?.email || 'user@risingstar.app',
    phone: user?.phone || '',
    country: user?.country || '',
    bio: user?.bio || '',
    language: user?.language || 'English',
    timezone:
      user?.timezone ||
      (typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'Africa/Lagos'),
    avatarUrl: resolveApiMediaUrl(user?.avatarUrl),
    tier: user?.tier || (user?.role === 'admin' ? 'Admin' : 'Tier 1'),
    aiBotEnabled: Boolean(user?.aiBotEnabled),
    createdAt: user?.createdAt || null,
    notificationSettings: normalizeNotificationSettings(user?.notificationSettings),
  }
}

function toProfileData(value: unknown, fallback: ProfileData): ProfileData {
  if (!value || typeof value !== 'object') {
    return fallback
  }

  const source = value as Partial<AuthUser>

  return {
    id: readString(source.id, fallback.id),
    name: readString(source.name, fallback.name),
    email: readString(source.email, fallback.email),
    phone: readString(source.phone, fallback.phone),
    country: readString(source.country, fallback.country),
    bio: readString(source.bio, fallback.bio),
    language: readString(source.language, fallback.language),
    timezone: readString(source.timezone, fallback.timezone),
    avatarUrl: resolveApiMediaUrl(readString(source.avatarUrl, fallback.avatarUrl)),
    tier: readString(source.tier, fallback.tier),
    aiBotEnabled: readBoolean(source.aiBotEnabled, fallback.aiBotEnabled),
    createdAt:
      typeof source.createdAt === 'string' || source.createdAt === null
        ? source.createdAt
        : fallback.createdAt,
    notificationSettings: normalizeNotificationSettings(source.notificationSettings),
  }
}

function toProfileStats(value: unknown): ProfileStats {
  if (!value || typeof value !== 'object') {
    return DEFAULT_STATS
  }

  const source = value as Partial<ProfileStats>
  const totalEarnings = Number(readNumber(source.totalEarnings, DEFAULT_STATS.totalEarnings).toFixed(2))
  const tasksCompleted = Math.max(0, Math.floor(readNumber(source.tasksCompleted, 0)))
  const daysActive = Math.max(1, Math.floor(readNumber(source.daysActive, 1)))

  return {
    totalEarnings,
    tasksCompleted,
    daysActive,
  }
}

function extractMessage(value: unknown, fallback: string) {
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') {
    return value.message
  }

  return fallback
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Unable to read image'))
    }

    reader.onerror = () => {
      reject(new Error('Unable to read image'))
    }

    reader.readAsDataURL(file)
  })
}

async function parseResponse(response: Response) {
  return (await response.json().catch(() => ({}))) as ProfileResponsePayload
}

export function useProfileData() {
  const fallbackProfile = useMemo(() => buildFallbackProfile(getAuthenticatedUser()), [])
  const [profile, setProfile] = useState<ProfileData>(fallbackProfile)
  const [stats, setStats] = useState<ProfileStats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const reload = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: {
        ...getAuthorizedHeaders(),
      },
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized()
      }

      throw new Error(extractMessage(data, 'Unable to load profile'))
    }

    const localUser = getAuthenticatedUser()
    const fallback = buildFallbackProfile(localUser)
    setProfile(toProfileData(data.user, fallback))
    setStats(toProfileStats(data.stats))
  }, [])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        await reload()
      } catch (loadError) {
        if (!mounted) {
          return
        }

        setProfile(buildFallbackProfile(getAuthenticatedUser()))
        setStats(DEFAULT_STATS)
        setError(loadError instanceof Error ? loadError.message : 'Unable to load profile')
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [reload])

  const saveProfile = useCallback(async (payload: ProfileUpdatePayload) => {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
        }

        throw new Error(extractMessage(data, 'Unable to update profile'))
      }

      const refreshed = await refreshAuthenticatedUser()
      const fallback = buildFallbackProfile(refreshed)
      setProfile(toProfileData(data.user ?? refreshed, fallback))
      setMessage(data.message || 'Profile updated')
      return { success: true as const, message: data.message || 'Profile updated' }
    } catch (updateError) {
      const nextError =
        updateError instanceof Error ? updateError.message : 'Unable to update profile'
      setError(nextError)
      return { success: false as const, message: nextError }
    } finally {
      setIsSaving(false)
    }
  }, [])

  const changePassword = useCallback(async (payload: PasswordPayload) => {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
        }

        throw new Error(extractMessage(data, 'Unable to change password'))
      }

      setMessage(data.message || 'Password updated')
      return { success: true as const, message: data.message || 'Password updated' }
    } catch (updateError) {
      const nextError =
        updateError instanceof Error ? updateError.message : 'Unable to change password'
      setError(nextError)
      return { success: false as const, message: nextError }
    } finally {
      setIsSaving(false)
    }
  }, [])

  const upgradeTier = useCallback(async (payload: TierUpgradePayload) => {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/tier-upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
        }

        throw new Error(extractMessage(data, 'Unable to upgrade tier'))
      }

      const refreshed = await refreshAuthenticatedUser()
      const fallback = buildFallbackProfile(refreshed)
      setProfile(toProfileData(data.user ?? refreshed, fallback))
      setMessage(data.message || 'Tier upgraded')
      return { success: true as const, message: data.message || 'Tier upgraded' }
    } catch (upgradeError) {
      const nextError =
        upgradeError instanceof Error ? upgradeError.message : 'Unable to upgrade tier'
      setError(nextError)
      return { success: false as const, message: nextError }
    } finally {
      setIsSaving(false)
    }
  }, [])

  const uploadAvatar = useCallback(async (file: File) => {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      if (file.size > MAX_AVATAR_SIZE_BYTES) {
        throw new Error('Profile photo must be 2MB or less')
      }

      const imageDataUrl = await fileToDataUrl(file)
      const payload: AvatarUploadPayload = {
        imageDataUrl,
        fileName: file.name,
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
        }

        throw new Error(extractMessage(data, 'Unable to upload avatar'))
      }

      const refreshed = await refreshAuthenticatedUser()
      const fallback = buildFallbackProfile(refreshed)
      setProfile(toProfileData(data.user ?? refreshed, fallback))
      setMessage(data.message || 'Profile photo updated')
      return { success: true as const, message: data.message || 'Profile photo updated' }
    } catch (uploadError) {
      const nextError =
        uploadError instanceof Error ? uploadError.message : 'Unable to upload avatar'
      setError(nextError)
      return { success: false as const, message: nextError }
    } finally {
      setIsSaving(false)
    }
  }, [])

  return {
    profile,
    stats,
    isLoading,
    isSaving,
    error,
    message,
    clearError: () => setError(''),
    clearMessage: () => setMessage(''),
    reload,
    saveProfile,
    changePassword,
    upgradeTier,
    uploadAvatar,
  }
}
