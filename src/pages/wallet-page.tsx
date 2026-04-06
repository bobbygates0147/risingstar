import { ArrowDownLeft, ArrowUpRight, Coins, CreditCard, Wallet } from 'lucide-react'
import { dashboardSummary } from '../data/platform-data'
import { formatUsd } from '../lib/format'

type WalletTransaction = {
  id: string
  label: string
  type: 'Deposit' | 'Reward' | 'Withdraw'
  amount: number
  status: 'Completed' | 'Pending' | 'Failed'
  date: string
}

const transactions: WalletTransaction[] = [
  {
    id: 'w1',
    label: 'USDT Deposit',
    type: 'Deposit',
    amount: 75_000,
    status: 'Completed',
    date: 'April 5, 2026 09:12',
  },
  {
    id: 'w2',
    label: 'Music Reward Batch',
    type: 'Reward',
    amount: 6_240,
    status: 'Completed',
    date: 'April 5, 2026 07:40',
  },
  {
    id: 'w3',
    label: 'USDT Withdrawal',
    type: 'Withdraw',
    amount: -30_000,
    status: 'Pending',
    date: 'April 4, 2026 18:03',
  },
  {
    id: 'w4',
    label: 'Ad Reward Batch',
    type: 'Reward',
    amount: 2_180,
    status: 'Failed',
    date: 'April 4, 2026 14:28',
  },
]

function statusClass(status: WalletTransaction['status']) {
  if (status === 'Completed') return 'bg-emerald-400/15 text-emerald-300 border-emerald-400/25'
  if (status === 'Pending') return 'bg-amber-400/15 text-amber-200 border-amber-400/25'
  return 'bg-rose-400/15 text-rose-200 border-rose-400/25'
}

function typeIcon(type: WalletTransaction['type']) {
  if (type === 'Deposit') return ArrowDownLeft
  if (type === 'Withdraw') return ArrowUpRight
  return Coins
}

export function WalletPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="surface-glow overflow-hidden rounded-[30px] p-6" style={{ backgroundImage: 'var(--gradient-hero-balance)' }}>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Wallet balance</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
            {formatUsd(dashboardSummary.balance)}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
            Deposit USDT to unlock more tasks, then withdraw earnings once fraud and timer checks are cleared.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--button-primary-bg)] px-4 text-sm font-semibold text-[var(--button-primary-text)] transition hover:bg-[var(--button-primary-hover)]"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Deposit
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </button>
          </div>
        </div>

        <div className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Wallet stats</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Withdrawable</p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                {formatUsd(dashboardSummary.withdrawable)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Pending payouts</p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                {formatUsd(30_000)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Primary method</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <CreditCard className="h-4 w-4 text-[var(--glow)]" />
                USDT (TRC20)
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Transactions</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">Recent wallet history</h3>
          </div>
          <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            <Wallet className="h-4 w-4 text-[var(--glow)]" />
            {transactions.length} entries
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {transactions.map((txn) => {
            const Icon = typeIcon(txn.type)

            return (
              <article
                key={txn.id}
                className="flex flex-col gap-3 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-panel)] text-[var(--glow)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{txn.label}</p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">{txn.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(txn.status)}`}>
                    {txn.status}
                  </span>
                  <p className={`font-display text-lg font-semibold ${txn.amount >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {txn.amount >= 0 ? '+' : ''}
                    {formatUsd(txn.amount)}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
