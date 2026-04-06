import clsx from 'clsx'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Music2,
  Plus,
  UploadCloud,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'

type WalletStatus = 'Completed' | 'Pending' | 'Failed'
type WalletKind = 'deposit' | 'earning' | 'withdrawal'

type WalletTransaction = {
  id: string
  title: string
  subtitle: string
  amount: number
  status: WalletStatus
  time: string
  kind: WalletKind
}

const walletTransactions: WalletTransaction[] = [
  {
    id: 'wallet-1',
    title: 'USDT Deposit',
    subtitle: 'From external wallet',
    amount: 500,
    status: 'Completed',
    time: 'Today, 10:30 AM',
    kind: 'deposit',
  },
  {
    id: 'wallet-2',
    title: 'Music Task Earnings',
    subtitle: 'Listened to "Blinding Lights" by The Weeknd',
    amount: 2.5,
    status: 'Completed',
    time: 'Today, 9:45 AM',
    kind: 'earning',
  },
  {
    id: 'wallet-3',
    title: 'USDT Withdrawal',
    subtitle: 'To Binance wallet (****8A2F)',
    amount: -100,
    status: 'Pending',
    time: 'Yesterday, 3:20 PM',
    kind: 'withdrawal',
  },
  {
    id: 'wallet-4',
    title: 'Music Task Earnings',
    subtitle: 'Listened to "Stay" by The Kid LAROI',
    amount: 1.8,
    status: 'Completed',
    time: 'Yesterday, 2:15 PM',
    kind: 'earning',
  },
  {
    id: 'wallet-5',
    title: 'USDT Withdrawal',
    subtitle: 'To external wallet - insufficient balance',
    amount: -1000,
    status: 'Failed',
    time: 'Yesterday, 11:30 AM',
    kind: 'withdrawal',
  },
  {
    id: 'wallet-6',
    title: 'Music Task Earnings',
    subtitle: 'Listened to "Heat Waves" by Glass Animals',
    amount: 3.2,
    status: 'Completed',
    time: '2 days ago',
    kind: 'earning',
  },
]

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatSignedUsd(amount: number) {
  const absoluteAmount = usdFormatter.format(Math.abs(amount))

  return amount >= 0 ? `+${absoluteAmount}` : `-${absoluteAmount}`
}

export function WalletPage() {
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | null>(
    null,
  )
  const [depositStep, setDepositStep] = useState<1 | 2>(1)
  const [copied, setCopied] = useState(false)
  const [activeTransaction, setActiveTransaction] =
    useState<WalletTransaction | null>(null)
  const [depositNetwork, setDepositNetwork] = useState<
    '' | 'trc20' | 'erc20' | 'bep20' | 'solana' | 'btc'
  >('')
  const depositAddresses: Record<
    'trc20' | 'erc20' | 'bep20' | 'solana' | 'btc',
    string
  > = {
    trc20: 'TQ9y9vTg3P6z8w1cR7F3QX9L2pQ5X1zQ9M',
    erc20: '0x2A9c18f9cA46b2c63C1C5f0fE6bC9aB54E9E1a20',
    bep20: '0xF2c2a1D77B9B12F7C1E4eB1E96fB0a7E2B3d2a1F',
    solana: '4kY8aJm3w9Yd2uK6Qx7N1dC8zH5pR2mX9vT7L1sQ3aZp',
    btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  }
  const depositAddress =
    depositNetwork ? depositAddresses[depositNetwork] : ''

  return (
    <div className="space-y-6">
      <section className="surface-glow rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.18)] text-[var(--glow)]">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Total balance
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Available for withdrawal
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            Last updated: 2 minutes ago
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
              {usdFormatter.format(2847.5)}
            </h2>
            <p className="mt-2 text-sm text-emerald-300">
              {usdFormatter.format(2847.5)} USDT
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Manage your balance and transactions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveModal('deposit')
                setDepositStep(1)
                setCopied(false)
                setDepositNetwork('')
              }}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(124,58,237,0.35)] transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Deposit USDT
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveModal('withdraw')
                setDepositStep(1)
                setCopied(false)
                setDepositNetwork('')
              }}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[rgba(124,58,237,0.6)] bg-transparent px-5 text-sm font-semibold text-[var(--glow)] shadow-[inset_0_0_0_1px_rgba(124,58,237,0.15)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </button>
          </div>
        </div>
      </section>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-sm"
            aria-label="Close modal backdrop"
          />
          <div className="relative w-full max-w-xl rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-popup)] p-6 shadow-[var(--shadow-popup)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  {activeModal === 'deposit' ? 'Deposit' : 'Withdraw'}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {activeModal === 'deposit'
                    ? 'Add USDT to your balance'
                    : 'Transfer earnings to your wallet'}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {activeModal === 'deposit'
                    ? 'Use your preferred network and reference to fund your account.'
                    : 'Withdrawals are reviewed before being released to external wallets.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                aria-label="Close modal"
              >
                X
              </button>
            </div>

            {activeModal === 'deposit' ? (
              <form
                className="mt-6 grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  setActiveModal(null)
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      'inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold',
                      depositStep === 1
                        ? 'border-[var(--border-strong)] bg-[rgba(124,58,237,0.16)] text-[var(--glow)]'
                        : 'border-[var(--border-soft)] text-[var(--text-tertiary)]',
                    )}
                  >
                    1
                  </span>
                  <span
                    className={clsx(
                      'inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold',
                      depositStep === 2
                        ? 'border-[var(--border-strong)] bg-[rgba(124,58,237,0.16)] text-[var(--glow)]'
                        : 'border-[var(--border-soft)] text-[var(--text-tertiary)]',
                    )}
                  >
                    2
                  </span>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {depositStep === 1
                      ? 'Enter deposit details'
                      : 'Copy address and upload proof'}
                  </p>
                </div>

                {depositStep === 1 ? (
                  <>
                    <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
                      Amount (USDT)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter amount"
                        className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                        required
                      />
                    </label>

                    <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
                      Funding network
                      <select
                        className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                        value={depositNetwork}
                        onChange={(event) =>
                          setDepositNetwork(
                            event.target.value as
                              | 'trc20'
                              | 'erc20'
                              | 'bep20'
                              | 'solana'
                              | 'btc'
                              | '',
                          )
                        }
                        required
                      >
                        <option value="" disabled>
                          Select a network
                        </option>
                        <option value="trc20">TRC20 (Tron)</option>
                        <option value="erc20">ERC20</option>
                        <option value="bep20">BEP20</option>
                        <option value="solana">Solana</option>
                        <option value="btc">Bitcoin (BTC)</option>
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
                      Deposit reference
                      <input
                        type="text"
                        placeholder="Transaction hash or reference"
                        className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                        required
                      />
                    </label>

                    <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
                      Note (optional)
                      <textarea
                        rows={3}
                        placeholder="Add a note for support"
                        className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                      />
                    </label>

                    <div className="mt-2 flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepositStep(2)}
                        disabled={!depositNetwork}
                        className={clsx(
                          'inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(124,58,237,0.35)] transition',
                          depositNetwork
                            ? 'bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] hover:brightness-110'
                            : 'cursor-not-allowed bg-[var(--surface-hover)] text-[var(--text-tertiary)] shadow-none',
                        )}
                      >
                        Continue
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Deposit address ({depositNetwork.toUpperCase()})
                      </p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="break-all text-sm font-medium text-[var(--text-primary)]">
                          {depositAddress}
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              if (depositAddress) {
                                await navigator.clipboard.writeText(depositAddress)
                                setCopied(true)
                                window.setTimeout(() => setCopied(false), 2000)
                              }
                            } catch {
                              setCopied(false)
                            }
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
                          aria-label="Copy address"
                          title={copied ? 'Copied' : 'Copy address'}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
                      Upload proof of payment
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                          required
                        />
                        <div className="flex min-h-[4.5rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-primary)] transition peer-hover:border-[var(--border-strong)]">
                          <UploadCloud className="h-5 w-5 text-[var(--text-tertiary)]" />
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            Click to upload
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            PNG, JPG, or PDF (max 5MB)
                          </span>
                        </div>
                      </div>
                    </label>

                    <div className="mt-2 flex flex-wrap justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setDepositStep(1)}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                      >
                        Back
                      </button>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveModal(null)}
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(124,58,237,0.35)] transition hover:brightness-110"
                        >
                          Submit deposit
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            ) : (
              <form
                className="mt-6 grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  setActiveModal(null)
                }}
              >
                <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
                  Amount (USDT)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                    className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
                  Payout network
                  <select
                    className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>
                      Select a network
                    </option>
                    <option value="trc20">TRC20 (Tron)</option>
                    <option value="erc20">ERC20</option>
                    <option value="bep20">BEP20</option>
                    <option value="solana">Solana</option>
                    <option value="btc">Bitcoin (BTC)</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
                  Destination wallet
                  <input
                    type="text"
                    placeholder="Wallet address"
                    className="h-11 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
                  Note (optional)
                  <textarea
                    rows={3}
                    placeholder="Add a note for support"
                    className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                  />
                </label>

                <div className="mt-2 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(124,58,237,0.35)] transition hover:brightness-110"
                  >
                    Request withdrawal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Recent Transactions
          </h3>
          <p className="text-sm text-[var(--text-secondary)] sm:text-right">
            {walletTransactions.length} records
          </p>
        </div>

        <div className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-6">
          <div className="space-y-4">
            {walletTransactions.map((entry) => {
              const isPositive = entry.amount >= 0
              const Icon =
                entry.kind === 'deposit'
                  ? ArrowDownLeft
                  : entry.kind === 'withdrawal'
                    ? ArrowUpRight
                    : Music2
              const iconClasses =
                entry.kind === 'withdrawal'
                  ? 'bg-rose-100/70 text-rose-600 dark:bg-[rgba(244,63,94,0.2)] dark:text-rose-300'
                  : 'bg-emerald-100/70 text-emerald-600 dark:bg-[rgba(16,185,129,0.16)] dark:text-emerald-300'
              const statusClasses =
                entry.status === 'Completed'
                  ? 'bg-emerald-100/70 text-emerald-700 dark:bg-[rgba(16,185,129,0.16)] dark:text-emerald-200'
                  : entry.status === 'Pending'
                    ? 'bg-amber-100/70 text-amber-700 dark:bg-[rgba(251,191,36,0.18)] dark:text-amber-200'
                    : 'bg-rose-100/70 text-rose-700 dark:bg-[rgba(244,63,94,0.18)] dark:text-rose-200'

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActiveTransaction(entry)}
                  className="grid w-full items-center gap-4 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  <span
                    className={clsx(
                      'flex h-11 w-11 items-center justify-center rounded-2xl',
                      iconClasses,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] sm:text-base">
                      {entry.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm">
                      {entry.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-col items-start text-left sm:items-end sm:text-right">
                    <p
                      className={clsx(
                        'text-sm font-semibold sm:text-base',
                        isPositive
                          ? 'text-emerald-600 dark:text-emerald-300'
                          : 'text-rose-600 dark:text-rose-300',
                      )}
                    >
                      {formatSignedUsd(entry.amount)}
                    </p>
                    <span
                      className={clsx(
                        'mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em]',
                        statusClasses,
                      )}
                    >
                      {entry.status}
                    </span>
                    <p className="mt-2 text-[11px] text-[var(--text-tertiary)] sm:text-xs">
                      {entry.time}
                    </p>
                  </div>
                </button>
              )}
            )}
          </div>
        </div>
      </section>

      {activeTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button
            type="button"
            onClick={() => setActiveTransaction(null)}
            className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-sm"
            aria-label="Close transaction modal"
          />
          <div className="relative w-full max-w-xl rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-popup)] p-6 shadow-[var(--shadow-popup)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Transaction details
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {activeTransaction.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {activeTransaction.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTransaction(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                aria-label="Close modal"
              >
                X
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-1 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Amount
                </p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {formatSignedUsd(activeTransaction.amount)}
                </p>
              </div>

              <div className="grid gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {activeTransaction.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Date</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {activeTransaction.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Type</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {activeTransaction.kind === 'deposit'
                      ? 'Deposit'
                      : activeTransaction.kind === 'withdrawal'
                        ? 'Withdrawal'
                        : 'Earnings'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reference</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {activeTransaction.id.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
