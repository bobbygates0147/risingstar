import clsx from 'clsx'
import {
  ArrowUpRight,
  Clapperboard,
  Disc3,
  Palette,
  Send,
  Wallet,
  X,
} from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PaginationControls } from '../components/pagination-controls'
import { type CryptoNetwork } from '../lib/crypto-wallets'
import {
  getAuthenticatedUser,
  getAuthorizedHeaders,
} from '../lib/auth'
import { useCurrencyConverter } from '../hooks/use-currency-converter'
import { showToast } from '../lib/toast'

type WalletStatus = 'Completed' | 'Pending' | 'Failed'
type WalletEntryKind = 'withdrawal' | 'music' | 'ads' | 'art' | 'social'

type WalletEntry = {
  id: string
  title: string
  detail: string
  amount: number
  status: WalletStatus
  timeLabel: string
  kind: WalletEntryKind
  network?: CryptoNetwork
  proofUrl?: string
  occurredAt?: string
}

type WalletSummaryResponse = {
  wallet?: {
    balance?: number
    withdrawable?: number
  }
}

type WalletWithdrawResponse = {
  message?: string
  wallet?: {
    balance?: number
    withdrawable?: number
  }
}

type WalletHistoryResponse = {
  entries?: unknown
}


const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')
const WALLET_SUMMARY_ENDPOINT = `${API_BASE_URL}/api/wallet/summary`
const WALLET_HISTORY_ENDPOINT = `${API_BASE_URL}/api/wallet/history`
const WALLET_WITHDRAW_ENDPOINT = `${API_BASE_URL}/api/wallet/withdraw`
const WALLET_UPDATED_EVENT = 'rising-star:wallet-updated'
const usdFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: 'currency',
})

const signedUsdFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: 'currency',
})

function formatSignedUsd(value: number) {
  const absolute = signedUsdFormatter.format(Math.abs(value))
  return value >= 0 ? `+${absolute}` : `-${absolute}`
}

function entryIcon(kind: WalletEntryKind) {
  if (kind === 'withdrawal') {
    return ArrowUpRight
  }

  if (kind === 'ads') {
    return Clapperboard
  }

  if (kind === 'art') {
    return Palette
  }

  if (kind === 'social') {
    return Send
  }

  return Disc3
}

function entryTone(kind: WalletEntryKind) {
  if (kind === 'withdrawal') {
    return 'bg-rose-500/15 text-rose-300'
  }
  return 'bg-emerald-500/15 text-emerald-300'
}

function statusTone(status: WalletStatus) {
  if (status === 'Completed') {
    return 'bg-emerald-500/20 text-emerald-300'
  }
  if (status === 'Pending') {
    return 'bg-amber-500/20 text-amber-300'
  }
  return 'bg-rose-500/20 text-rose-300'
}

function resolveEntryNetwork(entry: WalletEntry) {
  if (entry.network) {
    return entry.network
  }

  const candidates = ['TRC20', 'ERC20', 'BEP20', 'SOL', 'BTC']
  const detail = entry.detail.toUpperCase()
  return candidates.find((network) => detail.includes(network)) ?? '--'
}

function isWalletStatus(value: unknown): value is WalletStatus {
  return value === 'Completed' || value === 'Pending' || value === 'Failed'
}

function isWalletEntryKind(value: unknown): value is WalletEntryKind {
  return (
    value === 'withdrawal' ||
    value === 'music' ||
    value === 'ads' ||
    value === 'art' ||
    value === 'social'
  )
}

function isCryptoNetwork(value: unknown): value is CryptoNetwork {
  return (
    value === 'TRC20' ||
    value === 'ERC20' ||
    value === 'BEP20' ||
    value === 'SOL' ||
    value === 'BTC'
  )
}

function toWalletEntries(payload: unknown): WalletEntry[] {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as Record<string, unknown>

      if (
        typeof source.id !== 'string' ||
        typeof source.title !== 'string' ||
        typeof source.detail !== 'string' ||
        typeof source.amount !== 'number' ||
        typeof source.timeLabel !== 'string' ||
        !isWalletStatus(source.status) ||
        !isWalletEntryKind(source.kind)
      ) {
        return null
      }

      const network = isCryptoNetwork(source.network) ? source.network : undefined
      let proofUrl =
        typeof source.proofUrl === 'string' && source.proofUrl.trim().length > 0
          ? source.proofUrl.trim()
          : undefined

      if (proofUrl && proofUrl.startsWith('/')) {
        proofUrl = `${API_BASE_URL}${proofUrl}`
      }

      const occurredAt =
        typeof source.occurredAt === 'string' ? source.occurredAt : undefined

      return {
        id: source.id,
        title: source.title,
        detail: source.detail,
        amount: Number(source.amount),
        status: source.status,
        timeLabel: source.timeLabel,
        kind: source.kind,
        ...(network ? { network } : {}),
        ...(proofUrl ? { proofUrl } : {}),
        ...(occurredAt ? { occurredAt } : {}),
      } satisfies WalletEntry
    })
    .filter((entry): entry is WalletEntry => entry !== null)
}

export function WalletPage() {
  const PAGE_SIZE = 5
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeModal, setActiveModal] = useState<'withdraw' | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNetwork, setWithdrawNetwork] = useState<'' | CryptoNetwork>('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawMemo, setWithdrawMemo] = useState('')
  const [entries, setEntries] = useState<WalletEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<WalletEntry | null>(null)
  const [entriesPage, setEntriesPage] = useState(1)
  const authenticatedUser = getAuthenticatedUser()
  const [totalBalance, setTotalBalance] = useState(
    Number(authenticatedUser?.walletBalance || 0),
  )
  const [withdrawableBalance, setWithdrawableBalance] = useState(
    Number(authenticatedUser?.withdrawableBalance || 0),
  )
  const [lastSummaryUpdatedAt, setLastSummaryUpdatedAt] = useState<Date | null>(
    null,
  )
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [historyLoading, setHistoryLoading] = useState(true)
  const entriesPageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const currencyConverter = useCurrencyConverter(authenticatedUser?.countryCode)

  useEffect(() => {
    setEntriesPage((current) => Math.min(current, entriesPageCount))
  }, [entriesPageCount])


  

  const loadWalletSummary = useCallback(async () => {
    try {
      const response = await fetch(WALLET_SUMMARY_ENDPOINT, {
        headers: {
          ...getAuthorizedHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error('Wallet summary request failed')
      }

      const data = (await response.json()) as WalletSummaryResponse
      const nextBalance = Number(data.wallet?.balance || 0)
      const nextWithdrawable = Number(data.wallet?.withdrawable || 0)
      setTotalBalance(nextBalance)
      setWithdrawableBalance(nextWithdrawable)
      setLastSummaryUpdatedAt(new Date())
    } catch {
      const fallbackBalance = Number(getAuthenticatedUser()?.walletBalance || 0)
      const fallbackWithdrawable = Number(
        getAuthenticatedUser()?.withdrawableBalance || 0,
      )
      setTotalBalance(fallbackBalance)
      setWithdrawableBalance(fallbackWithdrawable)
      setLastSummaryUpdatedAt(new Date())
    }
  }, [])

  const loadWalletHistory = useCallback(async () => {
    try {
      setHistoryLoading(true)

      const response = await fetch(WALLET_HISTORY_ENDPOINT, {
        headers: {
          ...getAuthorizedHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error('Wallet history request failed')
      }

      const data = (await response.json()) as WalletHistoryResponse
      setEntries(toWalletEntries(data.entries))
      setEntriesPage(1)
    } catch {
      setEntries([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadWalletSummary()
    void loadWalletHistory()
  }, [loadWalletHistory, loadWalletSummary])

  useEffect(() => {
    function handleWalletUpdated() {
      void loadWalletSummary()
      void loadWalletHistory()
    }

    window.addEventListener(WALLET_UPDATED_EVENT, handleWalletUpdated)

    return () => {
      window.removeEventListener(WALLET_UPDATED_EVENT, handleWalletUpdated)
    }
  }, [loadWalletHistory, loadWalletSummary])

  const paginatedEntries = useMemo(() => {
    const startIndex = (entriesPage - 1) * PAGE_SIZE
    return entries.slice(startIndex, startIndex + PAGE_SIZE)
  }, [entries, entriesPage])
  const totalBalanceLocal = currencyConverter.formatDualFromUsd(totalBalance)
  const withdrawableBalanceLocal = currencyConverter.formatDualFromUsd(withdrawableBalance)

  function formatSignedLocalFromUsd(value: number) {
    const sign = value >= 0 ? '+' : '-'
    const pair = currencyConverter.formatDualFromUsd(Math.abs(value))
    return `${sign}${pair.local}`
  }
  const withdrawAmountValue = Number(withdrawAmount)
  const withdrawAmountLocal =
    Number.isFinite(withdrawAmountValue) && withdrawAmountValue > 0
      ? currencyConverter.formatDualFromUsd(withdrawAmountValue)
      : null

  const lastUpdatedLabel = useMemo(() => {
    if (!lastSummaryUpdatedAt) {
      return 'Updated just now'
    }

    const deltaMs = Date.now() - lastSummaryUpdatedAt.getTime()
    if (deltaMs < 60 * 1000) {
      return 'Updated just now'
    }

    if (deltaMs < 60 * 60 * 1000) {
      const minutes = Math.max(1, Math.floor(deltaMs / (60 * 1000)))
      return `Updated ${minutes}m ago`
    }

    if (deltaMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(deltaMs / (60 * 60 * 1000))
      return `Updated ${hours}h ago`
    }

    const days = Math.floor(deltaMs / (24 * 60 * 60 * 1000))
    return `Updated ${days}d ago`
  }, [lastSummaryUpdatedAt])
  


  function isPdfFile(url: string) {
    return url.toLowerCase().includes('.pdf')
  }

  function openWithdrawModal() {
    setActiveModal('withdraw')
    setWithdrawError('')
    setWithdrawAmount('')
    setWithdrawNetwork('')
    setWithdrawAddress('')
    setWithdrawMemo('')
  }

  async function handleWithdrawSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWithdrawError('')

    const amountValue = Number(withdrawAmount)
    const networkValue = withdrawNetwork
    const walletAddressValue = withdrawAddress.trim()
    const memoValue = withdrawMemo.trim()

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setWithdrawError('Enter a valid withdrawal amount.')
      return
    }

    if (!networkValue) {
      setWithdrawError('Select a funding network.')
      return
    }

    if (walletAddressValue.length < 10) {
      setWithdrawError('Enter a valid destination wallet address.')
      return
    }

    setWithdrawSubmitting(true)

    try {
      const response = await fetch(WALLET_WITHDRAW_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify({
          amountUsd: Number(amountValue.toFixed(2)),
          network: networkValue,
          walletAddress: walletAddressValue,
          memo: memoValue,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as WalletWithdrawResponse

      if (!response.ok) {
        const message =
          typeof data.message === 'string'
            ? data.message
            : 'Unable to submit withdrawal right now'
        throw new Error(message)
      }

      await loadWalletHistory()
      await loadWalletSummary()

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT))
      }

      showToast({
        title:
          typeof data.message === 'string' && data.message.trim().length > 0
            ? data.message
            : 'Withdrawal request submitted.',
        variant: 'success',
      })

      setActiveModal(null)
      setWithdrawAmount('')
      setWithdrawNetwork('')
      setWithdrawAddress('')
      setWithdrawMemo('')
      setWithdrawError('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to submit withdrawal right now'
      setWithdrawError(message)
      showToast({
        title: message,
        variant: 'error',
      })
    } finally {
      setWithdrawSubmitting(false)
    }
  }

  useEffect(() => {
    const requestedModal = searchParams.get('modal')
    if (!requestedModal) {
      return
    }

    if (requestedModal === 'withdraw') {
      openWithdrawModal()
    }

    if (requestedModal === 'withdraw') {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('modal')
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div />
      </section>

        <section
          className="surface-glow rounded-[30px] border border-[var(--border-soft)] p-6 shadow-[var(--shadow-panel)] sm:p-8"
          style={{ backgroundImage: 'var(--gradient-hero-balance)' }}
        >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.16)] text-[var(--glow)]">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                    Total Balance
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Available to withdraw: {usdFormatter.format(withdrawableBalance)}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    = {withdrawableBalanceLocal.local}
                  </p>
                </div>
              </div>

              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                {lastUpdatedLabel}
              </p>
            </div>

            <div>
              <p className="font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
                {usdFormatter.format(totalBalance)}
              </p>
              <p className="mt-2 text-sm text-emerald-200">
                = {totalBalanceLocal.local}
              </p>
              
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openWithdrawModal}
              className="inline-flex h-11 w-full items-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-panel)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] sm:w-auto"
            >
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Recent transactions
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
              History overview
            </h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {entries.length} total
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {historyLoading && (
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
              Loading transaction history...
            </div>
          )}
          {!historyLoading && entries.length === 0 && (
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
              No transactions yet.
            </div>
          )}
          {paginatedEntries.map((entry) => {
            const Icon = entryIcon(entry.kind)

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedEntry(entry)}
                className="flex w-full flex-col gap-4 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-panel-strong)] px-4 py-4 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3 text-[var(--text-primary)]">
                  <span
                    className={clsx(
                      'flex h-12 w-12 items-center justify-center rounded-2xl',
                      entryTone(entry.kind),
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {entry.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {entry.detail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
                  <p
                    className={clsx(
                      'font-display text-lg font-semibold',
                      entry.amount >= 0 ? 'text-emerald-200' : 'text-rose-300',
                    )}
                  >
                    {formatSignedUsd(entry.amount)}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Approx {formatSignedLocalFromUsd(entry.amount)}
                  </p>
                  <div className="flex flex-col items-start gap-2 text-xs text-[var(--text-secondary)] sm:items-end">
                    <span
                      className={clsx(
                        'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ring-1 ring-[var(--border-strong)]',
                        statusTone(entry.status),
                      )}
                    >
                      {entry.status}
                    </span>
                    <span>{entry.timeLabel}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <PaginationControls
          itemLabel="transactions"
          onPageChange={setEntriesPage}
          page={entriesPage}
          totalItems={entries.length}
        />
      </section>

      {(activeModal || selectedEntry) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button
            type="button"
            onClick={() => {
              setActiveModal(null)
              setSelectedEntry(null)
            }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            aria-label="Close modal overlay"
          />
          {selectedEntry ? (
            <div className="relative w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[28px] border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] p-6 text-[var(--text-primary)] shadow-[0_30px_80px_rgba(15,23,42,0.45)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                    Transaction details
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                    {selectedEntry.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {selectedEntry.detail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  aria-label="Close transaction details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Amount
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold text-[var(--text-primary)]">
                    {formatSignedUsd(selectedEntry.amount)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Local estimate: {formatSignedLocalFromUsd(selectedEntry.amount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Status
                  </p>
                  <span
                    className={clsx(
                      'mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ring-1 ring-[var(--border-strong)]',
                      statusTone(selectedEntry.status),
                    )}
                  >
                    {selectedEntry.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Network
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    {resolveEntryNetwork(selectedEntry)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Reference ID
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    {selectedEntry.id}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Time
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {selectedEntry.timeLabel}
                </p>
              </div>
              {selectedEntry.proofUrl && (
                <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Proof of payment
                  </p>
                  <div className="mt-3 flex flex-col gap-3">
                    <a
                      href={selectedEntry.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                    >
                      Open proof file
                    </a>
                    {!isPdfFile(selectedEntry.proofUrl) && (
                      <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)]">
                        <img
                          src={selectedEntry.proofUrl}
                          alt="Uploaded proof of payment"
                          className="w-full max-h-64 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[28px] border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] p-6 text-[var(--text-primary)] shadow-[0_30px_80px_rgba(15,23,42,0.45)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                    Withdraw
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                    Send USDT to another wallet
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Confirm the amount and destination wallet address.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                className="mt-6 space-y-4"
                onSubmit={handleWithdrawSubmit}
              >
                <label className="block text-sm text-[var(--text-secondary)]">
                  Amount (USDT)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                  />
                  {withdrawAmountLocal ? (
                    <span className="mt-2 block text-xs text-[var(--text-tertiary)]">
                      Local estimate: {withdrawAmountLocal.local}
                    </span>
                  ) : null}
                </label>

                <label className="block text-sm text-[var(--text-secondary)]">
                  Funding network
                  <select
                    required
                    value={withdrawNetwork}
                    onChange={(event) =>
                      setWithdrawNetwork(
                        event.target.value as '' | CryptoNetwork,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                  >
                    <option value="" disabled className="bg-[var(--surface-panel)] text-[var(--text-primary)]">
                      Select network
                    </option>
                    <option value="TRC20" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">TRC20</option>
                    <option value="ERC20" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">ERC20</option>
                    <option value="BEP20" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">BEP20</option>
                    <option value="SOL" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">SOL</option>
                    <option value="BTC" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">BTC</option>
                  </select>
                </label>

                <label className="block text-sm text-[var(--text-secondary)]">
                  To wallet address
                  <input
                    type="text"
                    required
                    placeholder="0x1234...destination"
                    value={withdrawAddress}
                    onChange={(event) =>
                      setWithdrawAddress(event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                  />
                </label>

                <label className="block text-sm text-[var(--text-secondary)]">
                  Memo (optional)
                  <input
                    type="text"
                    placeholder="Reference or note"
                    value={withdrawMemo}
                    onChange={(event) => setWithdrawMemo(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                  />
                </label>

                {withdrawError && (
                  <p className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {withdrawError}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawSubmitting}
                    className={clsx(
                      'inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition',
                      withdrawSubmitting ? 'cursor-wait opacity-80' : 'hover:brightness-110',
                    )}
                  >
                    {withdrawSubmitting ? 'Submitting...' : 'Confirm withdrawal'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


