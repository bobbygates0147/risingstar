import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  Bot,
  Check,
  CheckCircle2,
  Copy,
  PlayCircle,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAIBot } from '../hooks/use-ai-bot'
import { getAuthenticatedUser } from '../lib/auth'
import { formatUsd } from '../lib/format'
import { showToast } from '../lib/toast'

type PaymentMethod = 'crypto' | 'wallet'

const paymentMethodLabels: Record<PaymentMethod, string> = {
  crypto: 'Crypto Wallet',
  wallet: 'Wallet Balance',
}

type CryptoNetworkKey =
  | 'btc'
  | 'eth'
  | 'usdt_trc20'
  | 'usdt_erc20'
  | 'usdt_bep20'
  | 'sol'

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not set'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatCheckpointInterval(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '24 hours'
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return `${hours} hour${hours === 1 ? '' : 's'}`
  }

  return `${minutes} minutes`
}

export function AIBotPage() {
  const {
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
  } = useAIBot()

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('crypto')
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoNetworkKey>('usdt_trc20')
  const [paymentReference, setPaymentReference] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const [qrLoadError, setQrLoadError] = useState(false)
  const [paymentFlowOpen, setPaymentFlowOpen] = useState(false)
  const [paymentFlowError, setPaymentFlowError] = useState('')
  const paymentSectionRef = useRef<HTMLElement | null>(null)
  const lastMessageRef = useRef('')
  const lastErrorRef = useRef('')

  const availableMethods = useMemo(() => {
    const methods = new Set<PaymentMethod>(['crypto', 'wallet'])
    config.paymentMethods.forEach((method) => methods.add(method))
    return [...methods]
  }, [config.paymentMethods])

  const selectedMethodSafe = availableMethods.includes(selectedMethod)
    ? selectedMethod
    : availableMethods[0]

  useEffect(() => {
    if (!availableMethods.includes(selectedMethod)) {
      setSelectedMethod(availableMethods[0])
    }
  }, [availableMethods, selectedMethod])

  const networkOptions = useMemo(() => {
    const cryptoInstructions = config.paymentInstructions.crypto

    return [
      { key: 'usdt_trc20' as const, label: 'USDT (TRC20)', address: cryptoInstructions.usdtTrc20Address },
      { key: 'usdt_erc20' as const, label: 'USDT (ERC20)', address: cryptoInstructions.usdtErc20Address },
      { key: 'usdt_bep20' as const, label: 'USDT (BEP20)', address: cryptoInstructions.usdtBep20Address },
      { key: 'btc' as const, label: 'BTC', address: cryptoInstructions.btcAddress },
      { key: 'eth' as const, label: 'ETH', address: cryptoInstructions.ethAddress },
      { key: 'sol' as const, label: 'SOL', address: cryptoInstructions.solAddress },
    ]
  }, [config.paymentInstructions.crypto])

  const selectedNetworkOption = useMemo(() => {
    if (networkOptions.length === 0) {
      return null
    }

    return networkOptions.find((option) => option.key === selectedNetwork) || networkOptions[0]
  }, [networkOptions, selectedNetwork])

  const qrPayload = useMemo(() => {
    if (!selectedNetworkOption) {
      return ''
    }

    return [
      'Rising Star AI Bot Payment',
      `Amount USD: ${config.aiBotFeeUsd.toFixed(2)}`,
      `Network: ${selectedNetworkOption.label}`,
      `Address: ${selectedNetworkOption.address}`,
    ].join('\n')
  }, [config.aiBotFeeUsd, selectedNetworkOption])

  const qrImageUrl = useMemo(() => {
    if (!qrPayload) {
      return ''
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(qrPayload)}`
  }, [qrPayload])

  useEffect(() => {
    setQrLoadError(false)
  }, [qrImageUrl])

  const user = getAuthenticatedUser()
  const walletBalance = Number(user?.walletBalance ?? 0)
  const walletBalanceSafe = Number.isFinite(walletBalance) ? walletBalance : 0
  const walletHasEnoughBalance = walletBalanceSafe >= config.aiBotFeeUsd

  const constraints = [
    `Checkpoint is required every ${formatCheckpointInterval(config.checkpointIntervalMinutes)}.`,
    'If checkpoint is missed, auto-complete pauses until verified.',
    'All unlocked tasks are auto-processed while auto mode is ON.',
    `Subscription plan: ${config.subscriptionMonths} month${config.subscriptionMonths === 1 ? '' : 's'}.`,
  ]

  const isPurchased = Boolean(status.activatedAt)
  const subscriptionExpired = Boolean(status.subscription.expired)
  const needsRenewal = isPurchased && subscriptionExpired

  useEffect(() => {
    if (!isPurchased || needsRenewal) {
      return
    }

    setPaymentFlowOpen(false)
    setPaymentFlowError('')
    setPaymentReference('')
  }, [isPurchased, needsRenewal])

  useEffect(() => {
    if (!message || message === lastMessageRef.current) {
      return
    }

    lastMessageRef.current = message
    showToast({
      variant: 'success',
      title: 'AI Bot Update',
      description: message,
    })
  }, [message])

  useEffect(() => {
    if (!error || error === lastErrorRef.current) {
      return
    }

    lastErrorRef.current = error
    showToast({
      variant: 'error',
      title: 'AI Bot Alert',
      description: error,
    })
  }, [error])

  const statusLabel = !isPurchased
    ? 'Not Activated'
    : status.enabled
      ? status.checkpoint.required
        ? 'Checkpoint Required'
        : 'Auto Running'
      : 'Paused'

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

  function openPaymentFlow() {
    setPaymentFlowOpen(true)
    setPaymentFlowError('')

    window.requestAnimationFrame(() => {
      paymentSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  function handleStartPayment() {
    if (selectedMethodSafe === 'wallet' && !walletHasEnoughBalance) {
      setPaymentFlowOpen(true)
      setPaymentFlowError(
        `Insufficient wallet balance. You need ${formatUsd(config.aiBotFeeUsd)} to pay from wallet.`,
      )
      return
    }

    openPaymentFlow()
  }

  async function handleCompleteActivation() {
    setPaymentFlowError('')

    if (selectedMethodSafe === 'wallet') {
      if (!walletHasEnoughBalance) {
        setPaymentFlowError(
          `Insufficient wallet balance. You need ${formatUsd(config.aiBotFeeUsd)} to pay from wallet.`,
        )
        return
      }

      await activate({
        paymentMethod: 'wallet',
        paymentReference: `WALLET-AIBOT-${Date.now()}`,
        paymentAmountUsd: config.aiBotFeeUsd,
      })

      return
    }

    if (!paymentReference.trim() || paymentReference.trim().length < 3) {
      setPaymentFlowError('Please enter a valid payment reference.')
      return
    }

    await activate({
      paymentMethod: 'crypto',
      paymentReference: paymentReference.trim(),
      paymentAmountUsd: config.aiBotFeeUsd,
    })
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article
          className="surface-glow overflow-hidden rounded-[30px] p-6"
          style={{ backgroundImage: 'var(--gradient-hero-accent)' }}
        >
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Automation
          </p>
          <h2 className="mt-3 inline-flex items-center gap-2 font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
            <Bot className="h-9 w-9 text-[var(--glow)]" />
            AI Bot Assistant
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
            Once activated, AI Bot runs automatically in the background for all
            unlocked task slots. Users only need to complete checkpoints on
            schedule to keep automation active.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {!isPurchased || needsRenewal ? (
              <button
                type="button"
                onClick={openPaymentFlow}
                disabled={isBusy || isLoading}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Sparkles className="h-4 w-4" />
                {needsRenewal
                  ? `Renew ${config.subscriptionMonths}-Month Plan`
                  : `Pay ${formatUsd(config.aiBotFeeUsd)} and Activate`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleAutomation(!status.enabled)}
                disabled={isBusy || isLoading}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <PlayCircle className="h-4 w-4" />
                {isBusy
                  ? 'Processing...'
                  : status.enabled
                    ? 'Turn Auto Mode Off'
                    : 'Turn Auto Mode On'}
              </button>
            )}

            {isPurchased && status.enabled && status.checkpoint.required && (
              <button
                type="button"
                onClick={completeCheckpoint}
                disabled={isBusy || isLoading}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Complete checkpoint
              </button>
            )}

            <Link
              to="/tasks"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              Open task queue
            </Link>
          </div>

          {isLocalMode && (
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Local fallback mode active
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          )}
        </article>

        <article className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Session status
          </p>
          <div className="mt-4 space-y-3">
            <div
              className={clsx(
                'rounded-2xl border p-4',
                status.enabled
                  ? status.checkpoint.required
                    ? 'border-amber-400/30 bg-amber-400/10'
                    : 'border-emerald-400/30 bg-emerald-400/10'
                  : 'border-[var(--border-soft)] bg-[var(--surface-subtle)]',
              )}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Bot state
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                {isLoading ? 'Loading...' : statusLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Automation scope</p>
              <p className="mt-2 text-sm text-[var(--text-primary)]">
                Unlimited task processing
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                No daily run cap. Checkpoint compliance controls automation validity.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-secondary)]">
              <p>
                <span className="text-[var(--text-tertiary)]">Activated:</span>{' '}
                {formatDateTime(status.activatedAt)}
              </p>
              <p className="mt-1">
                <span className="text-[var(--text-tertiary)]">Plan:</span>{' '}
                {`${status.subscription.months} month${status.subscription.months === 1 ? '' : 's'}`}
              </p>
              <p className="mt-1">
                <span className="text-[var(--text-tertiary)]">Expires:</span>{' '}
                {formatDateTime(status.subscription.expiresAt)}
              </p>
              <p className="mt-1">
                <span className="text-[var(--text-tertiary)]">Last checkpoint:</span>{' '}
                {formatDateTime(status.checkpoint.lastCheckpointAt)}
              </p>
              <p className="mt-1">
                <span className="text-[var(--text-tertiary)]">Next checkpoint:</span>{' '}
                {formatDateTime(status.checkpoint.nextCheckpointAt)}
              </p>
            </div>
          </div>
        </article>
      </section>

      {(!isPurchased || needsRenewal) && (
        <section
          ref={paymentSectionRef}
          className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Bot payment
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
            Activate AI Bot after registration
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Payment method
              </span>
              <select
                value={selectedMethodSafe}
                onChange={(event) => {
                  setSelectedMethod(event.target.value as PaymentMethod)
                  setPaymentFlowOpen(false)
                  setPaymentFlowError('')
                  setPaymentReference('')
                  setCopyState('idle')
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
              >
                {availableMethods.map((method) => (
                  <option key={method} value={method}>
                    {paymentMethodLabels[method]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleStartPayment}
              disabled={isBusy || isLoading}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(124,58,237,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 sm:self-end"
            >
              {`Pay ${formatUsd(config.aiBotFeeUsd)}`}
            </button>
          </div>

          {paymentFlowError ? (
            <p className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {paymentFlowError}
            </p>
          ) : null}

          {paymentFlowOpen && selectedMethodSafe === 'crypto' && selectedNetworkOption && (
            <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-secondary)]">
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

              <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Send {formatUsd(config.aiBotFeeUsd)} To
                    </p>
                    <p className="mt-2 break-all text-sm font-medium leading-7 text-[var(--text-primary)]">
                      {selectedNetworkOption.address}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
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
                  </div>

                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-2">
                    {!qrLoadError && qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt={`Scan QR barcode for ${selectedNetworkOption.label} payment`}
                        className="h-28 w-28 rounded-xl object-cover sm:h-32 sm:w-32"
                        onError={() => setQrLoadError(true)}
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-[var(--border-soft)] text-center text-[11px] text-[var(--text-tertiary)] sm:h-32 sm:w-32">
                        QR unavailable
                      </div>
                    )}
                    <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Scan To Pay
                    </p>
                  </div>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Payment reference
                </span>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder="Transaction ID / transfer reference"
                  className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
                />
              </label>
            </div>
          )}

          {paymentFlowOpen && selectedMethodSafe === 'wallet' && (
            <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-secondary)]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    Wallet balance
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                    {formatUsd(walletBalanceSafe)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    Amount due
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                    {formatUsd(config.aiBotFeeUsd)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {walletHasEnoughBalance
                  ? 'Wallet payment is ready.'
                  : 'Insufficient wallet balance for AI Bot activation.'}
              </p>
            </div>
          )}

          {paymentFlowOpen && (
            <button
              type="button"
              onClick={() => void handleCompleteActivation()}
              disabled={
                isBusy ||
                isLoading ||
                (selectedMethodSafe === 'wallet' && !walletHasEnoughBalance)
              }
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] text-base font-semibold text-white shadow-[0_18px_30px_rgba(124,58,237,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isBusy
                ? 'Processing...'
                : selectedMethodSafe === 'wallet'
                  ? 'Pay from Wallet and Activate'
                  : 'Submit Payment and Activate'}
            </button>
          )}
        </section>
      )}

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          Compliance
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
          Manual checkpoint guardrails
        </h3>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {constraints.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4"
            >
              <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <ShieldAlert className="h-4 w-4 text-[var(--warning)]" />
                Check
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            Recommendation
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            AI Bot stays ON after activation, auto-runs unlocked tasks, and only
            pauses when checkpoint verification is due.
          </p>
        </div>
      </section>
    </div>
  )
}
