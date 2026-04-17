import clsx from 'clsx'
import {
  ArrowLeft,
  Bell,
  Bot,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Copy,
  Globe,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDashboardData } from '../hooks/use-dashboard-data'
import {
  type ProfileNotificationSettings,
  useProfileData,
} from '../hooks/use-profile-data'
import {
  fetchSignupConfig,
  getAuthenticatedUser,
  signOut,
  type SignupConfig,
  type SignupTierId,
} from '../lib/auth'
import { useCurrencyConverter } from '../hooks/use-currency-converter'
import { formatUsd } from '../lib/format'
import {
  DEFAULT_LANGUAGE_CODE,
  LANGUAGE_OPTIONS,
  normalizeLanguageCode,
  setStoredLanguageCode,
} from '../lib/languages'
import {
  formatTimeZoneLabel,
  getTimeZoneOptions,
  resolvePreferredTimeZone,
  setStoredTimeZonePreference,
} from '../lib/timezone'
import { showToast } from '../lib/toast'

type ProfileTabId =
  | 'profile'
  | 'security'
  | 'payment'
  | 'notifications'
  | 'language'
  | 'support'
  | 'legal'

type ProfileTab = {
  id: ProfileTabId
  label: string
  subtitle: string
  icon: typeof UserRound
}

const profileTabs: ProfileTab[] = [
  {
    id: 'profile',
    label: 'Profile Details',
    subtitle: 'Review registered identity and update contact details',
    icon: UserRound,
  },
  {
    id: 'security',
    label: 'Change Password',
    subtitle: 'Protect your account access',
    icon: KeyRound,
  },
  {
    id: 'payment',
    label: 'Payment Methods',
    subtitle: 'Manage wallet withdrawals',
    icon: Wallet,
  },
  {
    id: 'notifications',
    label: 'Notification Settings',
    subtitle: 'Control alerts and reminders',
    icon: Bell,
  },
  {
    id: 'language',
    label: 'Language',
    subtitle: 'Display language and timezone',
    icon: Globe,
  },
  {
    id: 'support',
    label: 'Help & Support',
    subtitle: 'Contact support and assistance',
    icon: CircleHelp,
  },
  {
    id: 'legal',
    label: 'Terms & Privacy',
    subtitle: 'Read compliance and policy details',
    icon: ShieldCheck,
  },
]

const defaultNotifications: ProfileNotificationSettings = {
  taskAlerts: true,
  securityAlerts: true,
  payoutAlerts: true,
  marketing: false,
}

type CryptoNetworkKey =
  | 'btc'
  | 'eth'
  | 'usdt_trc20'
  | 'usdt_erc20'
  | 'usdt_bep20'
  | 'sol'

function getUserInitials(name: string, email: string) {
  const source = name.trim() || email.trim()
  if (!source) {
    return 'RS'
  }

  const parts = source
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

function formatMemberSince(createdAt: string | null) {
  if (!createdAt) {
    return 'Member since this year'
  }

  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) {
    return 'Member since this year'
  }

  return `Member since ${new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(parsed)}`
}

function resolveTierId(value: string): SignupTierId {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '')

  if (normalized === 'tier2' || normalized === '2') {
    return 'tier2'
  }

  if (normalized === 'tier3' || normalized === '3') {
    return 'tier3'
  }

  if (normalized === 'tier4' || normalized === '4') {
    return 'tier4'
  }

  return 'tier1'
}

function getTierRank(tierId: SignupTierId) {
  if (tierId === 'tier1') {
    return 1
  }

  if (tierId === 'tier2') {
    return 2
  }

  if (tierId === 'tier3') {
    return 3
  }

  return 4
}

function getTierLabel(tierId: SignupTierId) {
  if (tierId === 'tier1') {
    return 'Tier 1'
  }

  if (tierId === 'tier2') {
    return 'Tier 2'
  }

  if (tierId === 'tier3') {
    return 'Tier 3'
  }

  return 'Tier 4'
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { summary } = useDashboardData()
  const currencyConverter = useCurrencyConverter(getAuthenticatedUser()?.countryCode)
  const {
    profile,
    stats,
    isLoading,
    isSaving,
    error,
    message,
    saveProfile,
    changePassword,
    upgradeTier,
    uploadAvatar,
  } = useProfileData()
  const [activeTab, setActiveTab] = useState<ProfileTabId>('profile')
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    country: '',
    bio: '',
  })
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [notificationForm, setNotificationForm] =
    useState<ProfileNotificationSettings>(defaultNotifications)
  const [languageForm, setLanguageForm] = useState({
    language: 'en',
    timezone: resolvePreferredTimeZone(),
  })
  const timeZoneOptions = useMemo(
    () => getTimeZoneOptions(languageForm.timezone),
    [languageForm.timezone],
  )
  const [tierUpgradeModalOpen, setTierUpgradeModalOpen] = useState(false)
  const [tierUpgradeConfig, setTierUpgradeConfig] = useState<SignupConfig | null>(null)
  const [tierUpgradeLoading, setTierUpgradeLoading] = useState(false)
  const [tierUpgradeSubmitting, setTierUpgradeSubmitting] = useState(false)
  const [tierUpgradeError, setTierUpgradeError] = useState('')
  const [tierUpgradeReference, setTierUpgradeReference] = useState('')
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<SignupTierId>('tier2')
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoNetworkKey>('usdt_trc20')
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const [qrLoadError, setQrLoadError] = useState(false)

  useEffect(() => {
    setProfileForm({
      name: profile.name,
      phone: profile.phone,
      country: profile.country,
      bio: profile.bio,
    })
    setNotificationForm({
      ...defaultNotifications,
      ...profile.notificationSettings,
    })
    setLanguageForm({
      language: normalizeLanguageCode(profile.language),
      timezone: resolvePreferredTimeZone(profile.timezone),
    })
  }, [profile])

  useEffect(() => {
    if (!message) {
      return
    }

    showToast({
      title: message,
      variant: 'success',
    })
  }, [message])

  useEffect(() => {
    if (!error) {
      return
    }

    showToast({
      title: error,
      variant: 'error',
    })
  }, [error])

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveProfile({
      phone: profileForm.phone.trim(),
      country: profileForm.country.trim(),
      bio: profileForm.bio.trim(),
    })
  }

  async function handleSecuritySave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (securityForm.newPassword.trim().length < 4) {
      showToast({
        title: 'New password should be at least 4 characters.',
        variant: 'warning',
      })
      return
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showToast({
        title: 'Password confirmation does not match.',
        variant: 'warning',
      })
      return
    }

    const result = await changePassword({
      currentPassword: securityForm.currentPassword,
      newPassword: securityForm.newPassword,
    })

    if (result.success) {
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    }
  }

  async function handleNotificationSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveProfile({
      notificationSettings: notificationForm,
    })
  }

  async function handleLanguageSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const languageCode = normalizeLanguageCode(languageForm.language)
    const timeZone = setStoredTimeZonePreference(languageForm.timezone)
    const result = await saveProfile({
      language: languageCode,
      timezone: timeZone,
    })

    if (result.success) {
      setStoredLanguageCode(languageCode)
      setLanguageForm((current) => ({
        ...current,
        timezone: timeZone,
      }))
    }
  }

  async function handleSwitchToEnglish() {
    const timeZone = setStoredTimeZonePreference(languageForm.timezone)
    const result = await saveProfile({
      language: DEFAULT_LANGUAGE_CODE,
      timezone: timeZone,
    })

    if (result.success) {
      setStoredLanguageCode(DEFAULT_LANGUAGE_CODE)
      setLanguageForm((current) => ({
        ...current,
        language: DEFAULT_LANGUAGE_CODE,
        timezone: timeZone,
      }))
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setAvatarBusy(true)
    await uploadAvatar(file)
    setAvatarBusy(false)
    event.target.value = ''
  }

  const currentTierId = useMemo(() => resolveTierId(profile.tier), [profile.tier])
  const currentTierRank = getTierRank(currentTierId)
  const nextTierId = currentTierRank < 4 ? (`tier${currentTierRank + 1}` as SignupTierId) : null
  const nextTierLabel = nextTierId ? getTierLabel(nextTierId) : 'Max tier'

  const availableUpgradeTiers = useMemo(() => {
    if (!tierUpgradeConfig) {
      return []
    }

    return tierUpgradeConfig.tiers.filter(
      (tier) => getTierRank(tier.id) > currentTierRank,
    )
  }, [currentTierRank, tierUpgradeConfig])

  const selectedUpgradeTierConfig = useMemo(() => {
    if (availableUpgradeTiers.length === 0) {
      return null
    }

    return (
      availableUpgradeTiers.find((tier) => tier.id === selectedUpgradeTier) ||
      availableUpgradeTiers[0]
    )
  }, [availableUpgradeTiers, selectedUpgradeTier])
  const selectedUpgradeTierLocal = selectedUpgradeTierConfig
    ? currencyConverter.formatDualFromUsd(selectedUpgradeTierConfig.feeUsd)
    : null

  const networkOptions = useMemo(() => {
    const crypto = tierUpgradeConfig?.paymentInstructions.crypto
    if (!crypto) {
      return []
    }

    return [
      { key: 'usdt_trc20' as const, label: 'USDT (TRC20)', address: crypto.usdtTrc20Address },
      { key: 'usdt_erc20' as const, label: 'USDT (ERC20)', address: crypto.usdtErc20Address },
      { key: 'usdt_bep20' as const, label: 'USDT (BEP20)', address: crypto.usdtBep20Address },
      { key: 'btc' as const, label: 'BTC', address: crypto.btcAddress },
      { key: 'eth' as const, label: 'ETH', address: crypto.ethAddress },
      { key: 'sol' as const, label: 'SOL', address: crypto.solAddress },
    ]
  }, [tierUpgradeConfig])

  const selectedNetworkOption = useMemo(() => {
    if (networkOptions.length === 0) {
      return null
    }

    return (
      networkOptions.find((option) => option.key === selectedNetwork) || networkOptions[0]
    )
  }, [networkOptions, selectedNetwork])

  const qrPayload = useMemo(() => {
    if (!selectedNetworkOption || !selectedUpgradeTierConfig) {
      return ''
    }

    return [
      'Rising Star Tier Upgrade',
      `Tier: ${selectedUpgradeTierConfig.label}`,
      `Amount USD: ${selectedUpgradeTierConfig.feeUsd.toFixed(2)}`,
      `= ${selectedUpgradeTierLocal?.local || ''}`,
      `Network: ${selectedNetworkOption.label}`,
      `Address: ${selectedNetworkOption.address}`,
    ].join('\n')
  }, [selectedNetworkOption, selectedUpgradeTierConfig, selectedUpgradeTierLocal])

  const qrImageUrl = useMemo(() => {
    if (!qrPayload) {
      return ''
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(qrPayload)}`
  }, [qrPayload])

  useEffect(() => {
    setQrLoadError(false)
  }, [qrImageUrl])

  useEffect(() => {
    if (availableUpgradeTiers.length === 0) {
      return
    }

    if (availableUpgradeTiers.some((tier) => tier.id === selectedUpgradeTier)) {
      return
    }

    setSelectedUpgradeTier(availableUpgradeTiers[0].id)
  }, [availableUpgradeTiers, selectedUpgradeTier])

  const handleOpenTierUpgradeModal = useCallback(async () => {
    setTierUpgradeError('')
    setTierUpgradeReference('')
    setCopyState('idle')
    setSelectedNetwork('usdt_trc20')
    setTierUpgradeModalOpen(true)

    if (tierUpgradeConfig) {
      return
    }

    setTierUpgradeLoading(true)

    try {
      const config = await fetchSignupConfig()
      setTierUpgradeConfig(config)
      if (config.tiers.length > 0) {
        const nextTier =
          config.tiers.find((tier) => getTierRank(tier.id) > currentTierRank) || config.tiers[0]
        setSelectedUpgradeTier(nextTier.id)
      }
    } catch {
      setTierUpgradeError('Unable to load upgrade pricing details right now.')
    } finally {
      setTierUpgradeLoading(false)
    }
  }, [currentTierRank, tierUpgradeConfig])

  useEffect(() => {
    if (searchParams.get('modal') !== 'tier-upgrade') {
      return
    }

    void handleOpenTierUpgradeModal()

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('modal')
    setSearchParams(nextParams, { replace: true })
  }, [handleOpenTierUpgradeModal, searchParams, setSearchParams])

  async function handleCopyUpgradeAddress() {
    if (!selectedNetworkOption) {
      return
    }

    try {
      await navigator.clipboard.writeText(selectedNetworkOption.address)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1400)
    } catch {
      setCopyState('idle')
    }
  }

  async function handleUpgradeTierSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTierUpgradeError('')

    if (!selectedUpgradeTierConfig) {
      setTierUpgradeError('No upgrade tier is available for your account.')
      return
    }

    if (!tierUpgradeReference.trim() || tierUpgradeReference.trim().length < 3) {
      setTierUpgradeError('Please enter a valid payment reference.')
      return
    }

    setTierUpgradeSubmitting(true)

    try {
      const result = await upgradeTier({
        tier: selectedUpgradeTierConfig.id,
        paymentMethod: 'crypto',
        paymentReference: tierUpgradeReference.trim(),
        paymentAmountUsd: selectedUpgradeTierConfig.feeUsd,
      })

      if (!result.success) {
        setTierUpgradeError(result.message)
        return
      }

      setTierUpgradeModalOpen(false)
      setTierUpgradeReference('')
    } finally {
      setTierUpgradeSubmitting(false)
    }
  }

  function handleLogout() {
    signOut()
    navigate('/login', { replace: true })
  }

  const userInitials = getUserInitials(profile.name, profile.email)
  const memberLabel = formatMemberSince(profile.createdAt)
  const tierProgress = Math.max(0, Math.min(100, Number(summary.tierProgress || 0)))

  return (
    <div className="space-y-6">
      <section
        className="surface-glow rounded-[28px] border border-[var(--border-soft)] p-6 shadow-[var(--shadow-panel)]"
        style={{ backgroundImage: 'var(--gradient-hero-balance)' }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <div className="h-full w-full overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-subtle)]">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.name} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--purple)] to-[var(--blue)] text-base font-semibold text-white">
                    {userInitials}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-[0_10px_24px_rgba(0,0,0,0.28)] ring-2 ring-[var(--surface-panel)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-65"
                aria-label="Update profile photo"
                disabled={avatarBusy || isSaving}
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="min-w-0">
              <p
                className="notranslate truncate font-display text-2xl font-semibold text-[var(--text-primary)]"
                translate="no"
              >
                {profile.name}
              </p>
              <p
                className="notranslate truncate text-sm text-[var(--text-secondary)]"
                translate="no"
              >
                {profile.email}
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{memberLabel}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-1 text-xs uppercase tracking-[0.15em] text-[var(--text-secondary)]">
              {profile.tier}
            </span>
            <button
              type="button"
              disabled={avatarBusy || isSaving}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-65"
            >
              <Camera className="h-4 w-4" />
              {avatarBusy ? 'Uploading photo...' : 'Update Profile Photo'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <article className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-panel)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Tier Status</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Premium tiers unlock better rewards and queue priority.</p>
            </div>
            <span className="rounded-full bg-[rgba(251,191,36,0.16)] px-3 py-1 text-xs font-medium text-amber-300">{profile.tier}</span>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--surface-track)]">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] to-[var(--blue)]" style={{ width: `${tierProgress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>{tierProgress}% to next tier</span>
            <span>{nextTierLabel}</span>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                if (currentTierRank >= 4) {
                  showToast({
                    title: 'Tier 4 is the highest tier available.',
                    variant: 'info',
                  })
                  return
                }

                void handleOpenTierUpgradeModal()
              }}
              className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(124,58,237,0.28)] transition hover:brightness-110"
            >
              {currentTierRank >= 4 ? 'Max Tier Reached' : 'Upgrade Tier'}
            </button>
          </div>
        </article>

        <article className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-panel)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Statistics</p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex justify-between text-[var(--text-secondary)]"><span>Total earnings</span><span className="font-semibold text-emerald-300">{formatUsd(stats.totalEarnings)}</span></p>
            <p className="flex justify-between text-[var(--text-secondary)]"><span>Tasks completed</span><span className="font-semibold text-[var(--text-primary)]">{stats.tasksCompleted}</span></p>
            <p className="flex justify-between text-[var(--text-secondary)]"><span>Days active</span><span className="font-semibold text-[var(--text-primary)]">{stats.daysActive}</span></p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-3 shadow-[var(--shadow-panel)]">
          <p className="px-2 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Settings</p>
          <div className="space-y-1">
            {profileTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                    activeTab === tab.id
                      ? 'border-[var(--border-strong)] bg-[rgba(124,58,237,0.16)]'
                      : 'border-transparent hover:border-[var(--border-soft)] hover:bg-[var(--surface-subtle)]',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-subtle)] text-[var(--text-primary)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{tab.label}</span>
                      <span className="block truncate text-xs text-[var(--text-tertiary)]">{tab.subtitle}</span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                </button>
              )
            })}
          </div>
        </aside>

        <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-panel)]">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Profile Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input value={profileForm.name} disabled translate="no" className="notranslate h-11 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel-strong)] px-3 text-sm text-[var(--text-secondary)] outline-none" />
                <input value={profile.email} disabled translate="no" className="notranslate h-11 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel-strong)] px-3 text-sm text-[var(--text-secondary)] outline-none" />
                <input value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" className="h-11 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none" />
                <input value={profileForm.country} onChange={(event) => setProfileForm((current) => ({ ...current, country: event.target.value }))} placeholder="Country" className="h-11 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none" />
              </div>
              <textarea value={profileForm.bio} onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))} placeholder="Short bio" rows={4} className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none" />
              <button disabled={isSaving || isLoading} className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Profile'}</button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSecuritySave} className="space-y-4">
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Change Password</h3>
              <input type="password" value={securityForm.currentPassword} onChange={(event) => setSecurityForm((current) => ({ ...current, currentPassword: event.target.value }))} placeholder="Current password" className="h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none" />
              <div className="grid gap-4 md:grid-cols-2">
                <input type="password" value={securityForm.newPassword} onChange={(event) => setSecurityForm((current) => ({ ...current, newPassword: event.target.value }))} placeholder="New password" className="h-11 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none" />
                <input type="password" value={securityForm.confirmPassword} onChange={(event) => setSecurityForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="Confirm password" className="h-11 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none" />
              </div>
              <button disabled={isSaving || isLoading} className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? 'Updating...' : 'Update Password'}</button>
            </form>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-3">
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Payment Methods</h3>
              <p className="text-sm text-[var(--text-secondary)]">Withdrawal methods are managed from Wallet.</p>
              <Link to="/wallet" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]">
                Open Wallet
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationSave} className="space-y-4">
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Notification Settings</h3>
              {([
                ['taskAlerts', 'Task alerts'],
                ['payoutAlerts', 'Payout alerts'],
                ['securityAlerts', 'Security alerts'],
                ['marketing', 'Promotional updates'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-2.5 text-sm">
                  <span className="text-[var(--text-primary)]">{label}</span>
                  <input type="checkbox" checked={Boolean(notificationForm[key])} onChange={(event) => setNotificationForm((current) => ({ ...current, [key]: event.target.checked }))} />
                </label>
              ))}
              <button disabled={isSaving || isLoading} className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Notifications'}</button>
            </form>
          )}

          {activeTab === 'language' && (
            <form onSubmit={handleLanguageSave} className="space-y-4">
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Language & Timezone</h3>
              <select value={languageForm.language} onChange={(event) => setLanguageForm((current) => ({ ...current, language: event.target.value }))} translate="no" className="notranslate h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none">
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language.code} value={language.code} translate="no" className="notranslate">
                    {language.label} ({language.code}) - {language.nativeLabel}
                  </option>
                ))}
              </select>
              <select value={languageForm.timezone} onChange={(event) => setLanguageForm((current) => ({ ...current, timezone: event.target.value }))} translate="no" className="notranslate h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none">
                {timeZoneOptions.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>
                    {formatTimeZoneLabel(timeZone)}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap items-center gap-3">
                <button disabled={isSaving || isLoading} className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Preferences'}</button>
                <button
                  type="button"
                  onClick={() => void handleSwitchToEnglish()}
                  disabled={isSaving || isLoading || languageForm.language === DEFAULT_LANGUAGE_CODE}
                  translate="no"
                  className="notranslate inline-flex h-10 items-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Use English
                </button>
              </div>
            </form>
          )}

          {activeTab === 'support' && (
            <div className="space-y-3">
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Help & Support</h3>
              <a href="mailto:support@risingstar.app" className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-primary)]">
                support@risingstar.app
                <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
              </a>
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                AI bot access and payout reviews are handled through support verification.
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="space-y-3">
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Terms & Privacy</h3>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                Your task activity, wallet events, and verification checkpoints are stored for fraud prevention and payout integrity. Profile data can be updated anytime in this panel.
              </p>
            </div>
          )}
        </div>
      </section>

      {tierUpgradeModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="surface-glow w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-popup)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Tier upgrade
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  Upgrade your account tier
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Use the same crypto payment flow, then submit your transfer reference.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTierUpgradeModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                aria-label="Close tier upgrade modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {tierUpgradeLoading ? (
              <div className="mt-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                Loading tier upgrade pricing...
              </div>
            ) : availableUpgradeTiers.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                You already have the highest available tier.
              </div>
            ) : (
              <form onSubmit={handleUpgradeTierSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Current tier
                    </span>
                    <input
                      value={profile.tier}
                      disabled
                      className="mt-2 h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel-strong)] px-3 text-sm text-[var(--text-secondary)] outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Upgrade to
                    </span>
                    <select
                      value={selectedUpgradeTier}
                      onChange={(event) => setSelectedUpgradeTier(event.target.value as SignupTierId)}
                      className="mt-2 h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                    >
                      {availableUpgradeTiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.label} - {formatUsd(tier.feeUsd)} = {currencyConverter.formatDualFromUsd(tier.feeUsd).local}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    Select crypto network
                  </span>
                  <select
                    value={selectedNetwork}
                    onChange={(event) => {
                      setSelectedNetwork(event.target.value as CryptoNetworkKey)
                      setCopyState('idle')
                    }}
                    className="mt-2 h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                  >
                    {networkOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedUpgradeTierConfig && selectedNetworkOption && (
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                          Send {formatUsd(selectedUpgradeTierConfig.feeUsd)} To
                        </p>
                        {selectedUpgradeTierLocal ? (
                          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                            = {selectedUpgradeTierLocal.local}
                          </p>
                        ) : null}
                        <p className="mt-2 break-all text-sm font-medium leading-7 text-[var(--text-primary)]">
                          {selectedNetworkOption.address}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                            {selectedNetworkOption.label}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpgradeAddress}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                          >
                            {copyState === 'copied' ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            {copyState === 'copied' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-2">
                        {!qrLoadError && qrImageUrl ? (
                          <img
                            src={qrImageUrl}
                            alt={`Scan QR barcode for ${selectedNetworkOption.label} payment`}
                            className="h-32 w-32 rounded-xl object-cover"
                            onError={() => setQrLoadError(true)}
                          />
                        ) : (
                          <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-[var(--border-soft)] text-center text-[11px] text-[var(--text-tertiary)]">
                            QR unavailable
                          </div>
                        )}
                        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                          Scan To Pay
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <label className="block">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Payment reference</span>
                  <input
                    value={tierUpgradeReference}
                    onChange={(event) => setTierUpgradeReference(event.target.value)}
                    placeholder="Transaction ID / transfer reference"
                    className="mt-2 h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                  />
                </label>

                {tierUpgradeError ? (
                  <p className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {tierUpgradeError}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setTierUpgradeModalOpen(false)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tierUpgradeSubmitting || isSaving}
                    className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(124,58,237,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {tierUpgradeSubmitting ? 'Upgrading...' : 'Complete Tier Upgrade'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <article className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-panel)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">AI Bot</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={clsx('inline-flex h-10 w-10 items-center justify-center rounded-xl', profile.aiBotEnabled ? 'bot-activated-pulse border border-[rgba(167,139,250,0.66)] bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] text-white' : 'border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]')}>
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{profile.aiBotEnabled ? 'Bot Active' : 'Bot Inactive'}</p>
                <p className="text-sm text-[var(--text-secondary)]">Manage task automation and checkpoints.</p>
              </div>
            </div>
            <Link to="/ai-bot" className="inline-flex h-10 items-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]">Manage AI Bot</Link>
          </div>
        </article>

        <button type="button" onClick={handleLogout} className="inline-flex h-11 items-center gap-2 self-start rounded-xl border border-rose-400/30 bg-rose-500/10 px-5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 lg:justify-self-end lg:self-center">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </section>
    </div>
  )
}
