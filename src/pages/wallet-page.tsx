import clsx from 'clsx'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Disc3,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'

type WalletStatus = 'Completed' | 'Pending' | 'Failed'
type WalletEntryKind = 'deposit' | 'withdrawal' | 'music'

type WalletEntry = {
  id: string
  title: string
  detail: string
  amount: number
  status: WalletStatus
  timeLabel: string
  kind: WalletEntryKind
  network?: 'TRC20' | 'ERC20' | 'BEP20' | 'SOL' | 'BTC'
}

const initialWalletEntries: WalletEntry[] = [
  {
    id: 'wallet-1',
    title: 'USDT Deposit',
    detail: 'From external wallet',
    amount: 500,
    status: 'Completed',
    timeLabel: 'Today, 10:30 AM',
    kind: 'deposit',
    network: 'TRC20',
  },
  {
    id: 'wallet-2',
    title: 'Music Task Earnings',
    detail: "Listened to 'Blinding Lights' by The Weeknd",
    amount: 2.5,
    status: 'Completed',
    timeLabel: 'Today, 9:45 AM',
    kind: 'music',
  },
  {
    id: 'wallet-3',
    title: 'USDT Withdrawal',
    detail: 'To Binance wallet (****8A2F)',
    amount: -100,
    status: 'Pending',
    timeLabel: 'Yesterday, 3:20 PM',
    kind: 'withdrawal',
    network: 'TRC20',
  },
  {
    id: 'wallet-4',
    title: 'Music Task Earnings',
    detail: "Listened to 'Stay' by The Kid LAROI",
    amount: 1.8,
    status: 'Completed',
    timeLabel: 'Yesterday, 2:15 PM',
    kind: 'music',
  },
  {
    id: 'wallet-5',
    title: 'USDT Withdrawal',
    detail: 'To external wallet - insufficient balance',
    amount: -1000,
    status: 'Failed',
    timeLabel: 'Yesterday, 11:30 AM',
    kind: 'withdrawal',
    network: 'TRC20',
  },
  {
    id: 'wallet-6',
    title: 'Music Task Earnings',
    detail: "Listened to 'Heat Waves' by Glass Animals",
    amount: 3.2,
    status: 'Completed',
    timeLabel: '2 days ago',
    kind: 'music',
  },
]

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
  if (kind === 'deposit') {
    return ArrowDownLeft
  }
  if (kind === 'withdrawal') {
    return ArrowUpRight
  }
  return Disc3
}

function entryTone(kind: WalletEntryKind) {
  if (kind === 'deposit') {
    return 'bg-emerald-500/15 text-emerald-300'
  }
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
  return candidates.find((network) => detail.includes(network)) ?? '—'
}

export function WalletPage() {
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | null>(
    null,
  )
  const [depositStep, setDepositStep] = useState<1 | 2>(1)
  const [depositNetwork, setDepositNetwork] = useState<
    '' | 'TRC20' | 'ERC20' | 'BEP20' | 'SOL' | 'BTC'
  >('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositReference, setDepositReference] = useState('')
  const [depositNote, setDepositNote] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNetwork, setWithdrawNetwork] = useState<
    '' | 'TRC20' | 'ERC20' | 'BEP20' | 'SOL' | 'BTC'
  >('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawMemo, setWithdrawMemo] = useState('')
  const [entries, setEntries] = useState<WalletEntry[]>(initialWalletEntries)
  const [selectedEntry, setSelectedEntry] = useState<WalletEntry | null>(null)
  const [showAllEntries, setShowAllEntries] = useState(false)
  const totalBalance = 2847.5
  const usdtBalance = 2847.5
  const depositAddress =
    depositNetwork === 'TRC20'
      ? 'TQ7QK1v7n3d8S3qE8P4m4K9r2q8p5y6z7a'
      : depositNetwork === 'ERC20'
        ? '0x83B2dB6C9aE0f1E5C4a2d5B1a9d4E6f8b9C0d1e2'
        : depositNetwork === 'BEP20'
          ? '0x6fC2b1A9D0c3E7f8a2B4c5D6e7F8a9B0c1D2E3f4'
          : depositNetwork === 'SOL'
            ? '9p9d6QZ7f2rZQ5m5bS8d5oJpQw4KfVb7mL2cT8yXhV4A'
            : depositNetwork === 'BTC'
              ? 'bc1q9xy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
              : '0x83B2dB6C9aE0f1E5C4a2d5B1a9d4E6f8b9C0d1e2'

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
                  Available for withdrawal
                </p>
              </div>
            </div>

            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Last updated: 2 minutes ago
            </p>
          </div>

          <div>
            <p className="font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
              {usdFormatter.format(totalBalance)}
            </p>
            <p className="mt-2 text-sm text-emerald-200">
              ≈ {usdFormatter.format(usdtBalance)} USDT
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveModal('deposit')
                setDepositStep(1)
                setDepositNetwork('')
                setDepositAmount('')
                setDepositReference('')
                setDepositNote('')
              }}
              className="inline-flex h-11 w-full items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:brightness-110 sm:w-auto"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Deposit USDT
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveModal('withdraw')
                setDepositStep(1)
                setWithdrawAmount('')
                setWithdrawNetwork('')
                setWithdrawAddress('')
                setWithdrawMemo('')
              }}
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
          <button
            type="button"
            onClick={() => setShowAllEntries((current) => !current)}
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] sm:w-auto"
          >
            {showAllEntries ? 'Show less' : 'View all'}
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {(showAllEntries ? entries : entries.slice(0, 4)).map((entry) => {
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
            </div>
          ) : (
            <div className="relative w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[28px] border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] p-6 text-[var(--text-primary)] shadow-[0_30px_80px_rgba(15,23,42,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                  {activeModal === 'deposit' ? 'Deposit' : 'Withdraw'}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {activeModal === 'deposit' && depositStep === 1
                    ? 'Add USDT to your wallet'
                    : activeModal === 'deposit'
                      ? 'Complete your deposit'
                      : 'Send USDT to another wallet'}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {activeModal === 'deposit' && depositStep === 1
                    ? 'Select a network and add a reference for this deposit.'
                    : activeModal === 'deposit'
                      ? 'Copy the deposit address and upload proof of payment.'
                      : 'Confirm the amount and destination wallet address.'}
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

            {activeModal === 'deposit' ? (
              <form
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (depositStep === 1) {
                    setDepositStep(2)
                    return
                  }

                  const amountValue = Number(depositAmount)
                  if (!Number.isFinite(amountValue) || amountValue <= 0) {
                    return
                  }

                  const networkLabel = depositNetwork || 'Network'
                  const referenceLabel = depositReference.trim()
                  const noteLabel = depositNote.trim()
                  const detailParts = [`${networkLabel} deposit`]

                  if (referenceLabel) {
                    detailParts.push(referenceLabel)
                  }
                  if (noteLabel) {
                    detailParts.push(noteLabel)
                  }

                  setEntries((current) => [
                    {
                      id: `wallet-${Date.now()}`,
                      title: 'USDT Deposit',
                      detail: detailParts.join(' • '),
                      amount: amountValue,
                      status: 'Pending',
                      timeLabel: 'Just now',
                      kind: 'deposit',
                      network: depositNetwork || undefined,
                    },
                    ...current,
                  ])

                  setActiveModal(null)
                  setDepositStep(1)
                  setDepositNetwork('')
                  setDepositAmount('')
                  setDepositReference('')
                  setDepositNote('')
                }}
              >
                {depositStep === 1 ? (
                  <>
                    <label className="block text-sm text-[var(--text-secondary)]">
                      Amount (USDT)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(event) => setDepositAmount(event.target.value)}
                        className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                      />
                    </label>

                    <label className="block text-sm text-[var(--text-secondary)]">
                      Funding network
                      <select
                        required
                        value={depositNetwork}
                        onChange={(event) =>
                          setDepositNetwork(
                            event.target.value as
                              | ''
                              | 'TRC20'
                              | 'ERC20'
                              | 'BEP20'
                              | 'SOL'
                              | 'BTC',
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
                      Reference
                      <input
                        type="text"
                        required
                        placeholder="Invoice, order, or note"
                        value={depositReference}
                        onChange={(event) =>
                          setDepositReference(event.target.value)
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <div className="rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Deposit address
                      </p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="break-all text-sm font-medium text-[var(--text-primary)]">
                          {depositAddress}
                        </p>
                        <button
                          type="button"
                          className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
                          aria-label="Copy deposit address"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <label className="block text-sm text-[var(--text-secondary)]">
                      Upload proof of payment
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        className="mt-2 w-full rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-sm text-[var(--text-secondary)] file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(124,58,237,0.18)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                      />
                    </label>

                    <label className="block text-sm text-[var(--text-secondary)]">
                      Note (optional)
                      <input
                        type="text"
                        placeholder="Add a note for this deposit"
                        value={depositNote}
                        onChange={(event) => setDepositNote(event.target.value)}
                        className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                      />
                    </label>
                  </>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      depositStep === 1
                        ? setActiveModal(null)
                        : setDepositStep(1)
                    }
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  >
                    {depositStep === 1 ? 'Cancel' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:brightness-110"
                  >
                    {depositStep === 1 ? 'Continue' : 'Submit deposit'}
                  </button>
                </div>
              </form>
            ) : (
              <form
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  const amountValue = Number(withdrawAmount)
                  if (!Number.isFinite(amountValue) || amountValue <= 0) {
                    return
                  }

                  const networkLabel = withdrawNetwork || 'Network'
                  const detailParts = [`${networkLabel} withdrawal`, `To ${withdrawAddress.trim()}`]
                  const memoValue = withdrawMemo.trim()

                  if (memoValue) {
                    detailParts.push(memoValue)
                  }

                  setEntries((current) => [
                    {
                      id: `wallet-${Date.now()}`,
                      title: 'USDT Withdrawal',
                      detail: detailParts.join(' • '),
                      amount: -Math.abs(amountValue),
                      status: 'Pending',
                      timeLabel: 'Just now',
                      kind: 'withdrawal',
                      network: withdrawNetwork || undefined,
                    },
                    ...current,
                  ])

                  setActiveModal(null)
                  setWithdrawAmount('')
                  setWithdrawAddress('')
                  setWithdrawMemo('')
                }}
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
                </label>

                <label className="block text-sm text-[var(--text-secondary)]">
                  Funding network
                  <select
                    required
                    value={withdrawNetwork}
                    onChange={(event) =>
                      setWithdrawNetwork(
                        event.target.value as
                          | ''
                          | 'TRC20'
                          | 'ERC20'
                          | 'BEP20'
                          | 'SOL'
                          | 'BTC',
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
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:brightness-110"
                  >
                    Confirm withdrawal
                  </button>
                </div>
                </form>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  )
}
