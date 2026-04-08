import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Sparkles } from 'lucide-react'
import {
  fetchSignupConfig,
  login,
  signup,
  type SignupConfig,
} from '../lib/auth'
import { formatUsd } from '../lib/format'
import { showToast } from '../lib/toast'

type SignupTierId = 'tier1' | 'tier2' | 'tier3'
type SignupPaymentMethod = 'crypto'

type SignupDraft = {
  name: string
  email: string
  password: string
  tier: SignupTierId
  paymentMethod: SignupPaymentMethod
}

const SIGNUP_DRAFT_STORAGE_KEY = 'rising-star-signup-draft'

const paymentMethodLabels: Record<SignupPaymentMethod, string> = {
  crypto: 'Crypto Wallet',
}

type CryptoNetworkKey =
  | 'btc'
  | 'eth'
  | 'usdt_trc20'
  | 'usdt_erc20'
  | 'usdt_bep20'
  | 'sol'

function saveSignupDraft(draft: SignupDraft) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(SIGNUP_DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

function readSignupDraft() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.sessionStorage.getItem(SIGNUP_DRAFT_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as SignupDraft

    if (
      !parsed?.name ||
      !parsed?.email ||
      !parsed?.password ||
      (parsed.tier !== 'tier1' && parsed.tier !== 'tier2' && parsed.tier !== 'tier3') ||
      parsed.paymentMethod !== 'crypto'
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function clearSignupDraft() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(SIGNUP_DRAFT_STORAGE_KEY)
}

function AuthLayout({
  children,
  subtitle,
  title,
}: {
  children: ReactNode
  subtitle: string
  title: string
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[rgba(124,58,237,0.25)] blur-3xl" />
        <div className="absolute -right-16 top-6 h-80 w-80 rounded-full bg-[rgba(59,130,246,0.2)] blur-3xl" />
        <div className="absolute left-1/2 top-[55%] h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(124,58,237,0.12)] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[29rem]">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--purple)] via-[var(--glow)] to-[var(--blue)] shadow-[0_18px_40px_rgba(124,58,237,0.35)]">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (isSubmitting) {
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password.trim() || password.length < 4) {
      setError('Password should be at least 4 characters.')
      return
    }

    try {
      setIsSubmitting(true)
      const authResponse = await login(email.trim(), password)
      const displayName =
        authResponse.user.name?.trim().length
          ? authResponse.user.name.trim()
          : 'Rising Star User'

      showToast({
        variant: 'success',
        title: `Welcome back, ${displayName}`,
        description: 'Your dashboard is ready. Let us hit today’s targets.',
      })

      navigate(authResponse.user.role === 'admin' ? '/admin' : '/', {
        replace: true,
      })
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to complete authentication request'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="MusicFlow" subtitle="Promote your music and earn rewards">
      <form
        onSubmit={handleSubmit}
        className="surface-glow rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-8"
      >
        <h2 className="text-center font-display text-3xl font-semibold text-[var(--text-primary)]">
          Welcome Back
        </h2>

        <p className="mt-2 text-center text-xs text-[var(--text-tertiary)]">
          Direct email and password authentication.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] text-base font-semibold text-white shadow-[0_18px_30px_rgba(124,58,237,0.28)] transition hover:brightness-110"
        >
          {isSubmitting ? 'Please wait...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-[var(--text-secondary)]">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-[var(--glow)] transition hover:text-[var(--blue)]"
        >
          Create account
        </Link>
      </p>
    </AuthLayout>
  )
}

export function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedTier, setSelectedTier] = useState<SignupTierId>('tier1')
  const [paymentMethod, setPaymentMethod] = useState<SignupPaymentMethod>('crypto')
  const [signupConfig, setSignupConfig] = useState<SignupConfig | null>(null)
  const [isLoadingSignupConfig, setIsLoadingSignupConfig] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    setIsLoadingSignupConfig(true)

    fetchSignupConfig()
      .then((config) => {
        if (!isMounted) {
          return
        }

        setSignupConfig(config)

        if (config.tiers.length > 0) {
          setSelectedTier(config.tiers[0].id)
        }

        if (config.paymentMethods.length > 0) {
          setPaymentMethod(config.paymentMethods[0])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSignupConfig(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const selectedTierConfig = signupConfig?.tiers.find((tier) => tier.id === selectedTier)

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your display name.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password.trim() || password.length < 4) {
      setError('Password should be at least 4 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!signupConfig || !selectedTierConfig) {
      setError('Signup pricing is still loading. Please wait.')
      return
    }

    saveSignupDraft({
      name: name.trim(),
      email: email.trim(),
      password,
      tier: selectedTier,
      paymentMethod,
    })

    navigate('/signup/payment')
  }

  return (
    <AuthLayout title="MusicFlow" subtitle="Registration requires payment before account activation">
      <form
        onSubmit={handleContinue}
        className="surface-glow rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-8"
      >
        <h2 className="text-center font-display text-3xl font-semibold text-[var(--text-primary)]">
          Create Account
        </h2>

        <p className="mt-2 text-center text-xs text-[var(--text-tertiary)]">
          Step 1 of 2: account and payment setup.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Name</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Confirm password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Tier</span>
            <select
              value={selectedTier}
              onChange={(event) => setSelectedTier(event.target.value as SignupTierId)}
              disabled={isLoadingSignupConfig || !signupConfig}
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
            >
              {signupConfig?.tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.label} - {formatUsd(tier.feeUsd)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Payment method</span>
            <input
              type="text"
              value={paymentMethodLabels[paymentMethod]}
              disabled
              className="mt-2 h-12 w-full cursor-not-allowed rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none"
            />
          </label>

          {selectedTierConfig && (
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">
                Registration fee: {formatUsd(selectedTierConfig.feeUsd)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Currency: USD
              </p>
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] text-base font-semibold text-white shadow-[0_18px_30px_rgba(124,58,237,0.28)] transition hover:brightness-110"
        >
          Continue to Payment
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-[var(--glow)] transition hover:text-[var(--blue)]"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export function SignupPaymentPage() {
  const navigate = useNavigate()
  const [signupConfig, setSignupConfig] = useState<SignupConfig | null>(null)
  const [draft, setDraft] = useState<SignupDraft | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoNetworkKey>('usdt_trc20')
  const [paymentReference, setPaymentReference] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const [qrLoadError, setQrLoadError] = useState(false)
  const [error, setError] = useState('')
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    Promise.all([fetchSignupConfig(), Promise.resolve(readSignupDraft())])
      .then(([config, storedDraft]) => {
        if (!isMounted) {
          return
        }

        setSignupConfig(config)

        if (!storedDraft) {
          navigate('/signup', { replace: true })
          return
        }

        setDraft(storedDraft)
      })
      .finally(() => {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [navigate])

  const selectedTier = useMemo(() => {
    if (!signupConfig || !draft) {
      return null
    }

    return signupConfig.tiers.find((tier) => tier.id === draft.tier) || null
  }, [signupConfig, draft])

  const cryptoInstructions = signupConfig?.paymentInstructions.crypto
  const networkOptions = useMemo(() => {
    if (!cryptoInstructions) {
      return []
    }

    return [
      { key: 'usdt_trc20' as const, label: 'USDT (TRC20)', address: cryptoInstructions.usdtTrc20Address },
      { key: 'usdt_erc20' as const, label: 'USDT (ERC20)', address: cryptoInstructions.usdtErc20Address },
      { key: 'usdt_bep20' as const, label: 'USDT (BEP20)', address: cryptoInstructions.usdtBep20Address },
      { key: 'btc' as const, label: 'BTC', address: cryptoInstructions.btcAddress },
      { key: 'eth' as const, label: 'ETH', address: cryptoInstructions.ethAddress },
      { key: 'sol' as const, label: 'SOL', address: cryptoInstructions.solAddress },
    ]
  }, [cryptoInstructions])

  const selectedNetworkOption = useMemo(() => {
    if (networkOptions.length === 0) {
      return null
    }

    return networkOptions.find((option) => option.key === selectedNetwork) || networkOptions[0]
  }, [networkOptions, selectedNetwork])

  const qrPayload = useMemo(() => {
    if (!selectedNetworkOption || !selectedTier) {
      return ''
    }

    return [
      'Rising Star Signup Payment',
      `Tier: ${selectedTier.label}`,
      `Amount USD: ${selectedTier.feeUsd.toFixed(2)}`,
      `Network: ${selectedNetworkOption.label}`,
      `Address: ${selectedNetworkOption.address}`,
    ].join('\n')
  }, [selectedNetworkOption, selectedTier])

  const qrImageUrl = useMemo(() => {
    if (!qrPayload) {
      return ''
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(qrPayload)}`
  }, [qrPayload])

  useEffect(() => {
    setQrLoadError(false)
  }, [qrImageUrl])

  async function handleCopyAddress() {
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

  async function handleCompleteSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (isSubmitting) {
      return
    }

    if (!draft || !signupConfig || !selectedTier) {
      setError('Signup session expired. Please restart registration.')
      return
    }

    if (!paymentReference.trim() || paymentReference.trim().length < 3) {
      setError('Please enter a valid payment reference.')
      return
    }

    try {
      setIsSubmitting(true)

      const authResponse = await signup({
        name: draft.name,
        email: draft.email,
        password: draft.password,
        tier: draft.tier,
        paymentMethod: draft.paymentMethod,
        paymentReference: paymentReference.trim(),
        paymentAmountUsd: selectedTier.feeUsd,
      })

      showToast({
        variant: 'success',
        title: `Welcome, ${authResponse.user.name || draft.name}`,
        description: 'Your account is live and ready for tasks.',
      })

      clearSignupDraft()

      navigate(authResponse.user.role === 'admin' ? '/admin' : '/', {
        replace: true,
      })
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to complete signup request'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isBootstrapping) {
    return (
      <AuthLayout title="Payment" subtitle="Loading payment details">
        <div className="surface-glow rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-8">
          Preparing your payment instructions...
        </div>
      </AuthLayout>
    )
  }

  if (!draft || !signupConfig || !selectedTier) {
    return null
  }

  return (
    <AuthLayout title="Payment" subtitle="Step 2 of 2: complete payment and submit reference">
      <form
        onSubmit={handleCompleteSignup}
        className="surface-glow rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            {paymentMethodLabels[draft.paymentMethod]}
          </span>
        </div>

        <h2 className="mt-4 text-center font-display text-3xl font-semibold text-[var(--text-primary)]">
          Complete Payment
        </h2>

        <p className="mt-2 text-center text-xs text-[var(--text-tertiary)]">
          Pay {formatUsd(selectedTier.feeUsd)} for {selectedTier.label} and submit your reference.
        </p>

        <div className="mt-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-secondary)]">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Select Crypto Network
            </span>
            <select
              value={selectedNetwork}
              onChange={(event) => {
                setSelectedNetwork(event.target.value as CryptoNetworkKey)
                setCopyState('idle')
              }}
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
            >
              {networkOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {selectedNetworkOption && (
            <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Send {formatUsd(selectedTier.feeUsd)} To
              </p>
              <p className="mt-2 break-all text-sm font-medium leading-7 text-[var(--text-primary)]">
                {selectedNetworkOption.address}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  {selectedNetworkOption.label}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                >
                  {copyState === 'copied' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copyState === 'copied' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-3">
                <div className="mx-auto w-fit rounded-xl border border-[var(--border-soft)] bg-white p-1.5">
                  {!qrLoadError && qrImageUrl ? (
                    <img
                      src={qrImageUrl}
                      alt={`Scan QR barcode for ${selectedNetworkOption.label} payment`}
                      className="h-40 w-40 rounded-lg object-cover sm:h-44 sm:w-44"
                      onError={() => setQrLoadError(true)}
                    />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed border-[var(--border-soft)] text-center text-[11px] text-[var(--text-tertiary)] sm:h-44 sm:w-44">
                      QR unavailable
                    </div>
                  )}
                </div>
                <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  Scan To Pay
                </p>
              </div>
            </div>
          )}
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Payment reference</span>
          <input
            type="text"
            value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)}
            placeholder="Transaction ID / transfer reference"
            className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
          />
        </label>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] text-base font-semibold text-white shadow-[0_18px_30px_rgba(124,58,237,0.28)] transition hover:brightness-110"
        >
          {isSubmitting ? 'Please wait...' : 'Complete Signup'}
        </button>
      </form>
    </AuthLayout>
  )
}
