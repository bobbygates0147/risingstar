import clsx from 'clsx'
import {
  Activity,
  Crown,
  Medal,
  RefreshCw,
  Sparkles,
  Trophy,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import {
  type WithdrawalLeaderboardEntry,
  useWithdrawalLeaderboardData,
} from '../hooks/use-withdrawal-leaderboard-data'
import { formatUsd } from '../lib/format'

function getRankTone(rank: number) {
  if (rank === 1) {
    return 'bg-amber-500/18 text-amber-200 ring-1 ring-amber-300/35'
  }

  if (rank === 2) {
    return 'bg-sky-500/18 text-sky-200 ring-1 ring-sky-300/35'
  }

  if (rank === 3) {
    return 'bg-emerald-500/18 text-emerald-200 ring-1 ring-emerald-300/35'
  }

  return 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] ring-1 ring-[var(--border-soft)]'
}

function getRankLabel(rank: number) {
  if (rank === 1) {
    return 'Highest withdrawal'
  }

  if (rank === 2) {
    return 'Runner up'
  }

  if (rank === 3) {
    return 'Podium'
  }

  return 'Ranked'
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Updated just now'
  }

  return `Updated ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`
}

function LeaderboardRow({ entry }: { entry: WithdrawalLeaderboardEntry }) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-4 rounded-[24px] border px-4 py-4 transition sm:flex-row sm:items-center sm:justify-between',
        entry.isCurrentUser
          ? 'border-[var(--border-strong)] bg-[rgba(124,58,237,0.14)]'
          : 'border-[var(--border-soft)] bg-[var(--surface-subtle)]',
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={clsx(
            'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl font-display text-xs font-semibold',
            getRankTone(entry.rank),
          )}
        >
          <Trophy className="h-4 w-4" />
          #{entry.rank}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-[var(--text-primary)]">
              {entry.name}
            </p>
            <span className="rounded-full bg-[rgba(124,58,237,0.16)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--glow)]">
              {entry.badge}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {entry.country ? `${entry.country} - ` : ''}{entry.tier} - {entry.withdrawalCount} approved withdrawals - last {entry.lastWithdrawalLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-right sm:min-w-[15rem]">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Total withdrawn
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-emerald-300">
            {formatUsd(entry.totalWithdrawnUsd)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Biggest
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-[var(--text-primary)]">
            {formatUsd(entry.biggestWithdrawalUsd)}
          </p>
        </div>
      </div>
    </div>
  )
}

function PodiumCard({ entry }: { entry: WithdrawalLeaderboardEntry }) {
  return (
    <article
      className={clsx(
        'rounded-[28px] border p-5',
        entry.rank === 1
          ? 'border-amber-400/35 bg-amber-500/10'
          : 'border-[var(--border-soft)] bg-[var(--surface-subtle)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={clsx(
            'flex h-12 w-12 items-center justify-center rounded-2xl',
            getRankTone(entry.rank),
          )}
        >
          {entry.rank === 1 ? (
            <Crown className="h-5 w-5" />
          ) : (
            <Medal className="h-5 w-5" />
          )}
        </span>
        <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          {getRankLabel(entry.rank)}
        </span>
      </div>
      <h3 className="mt-5 truncate font-display text-2xl font-semibold text-[var(--text-primary)]">
        {entry.name}
      </h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {entry.country ? `${entry.country} - ` : ''}{formatUsd(entry.totalWithdrawnUsd)} total withdrawn
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        Biggest approved withdrawal: {formatUsd(entry.biggestWithdrawalUsd)}
      </p>
    </article>
  )
}

export function LeaderboardPage() {
  const {
    entries,
    error,
    isLoading,
    refreshIntervalMs,
    stats,
    updatedAt,
  } = useWithdrawalLeaderboardData()
  const podium = entries.slice(0, 3)
  const currentUserEntry = entries.find((entry) => entry.isCurrentUser)
  const refreshSeconds = Math.max(1, Math.round(refreshIntervalMs / 1000))
  const rankLabel = currentUserEntry ? `#${currentUserEntry.rank}` : 'Unranked'
  const rankDetail = stats.currentUserEligible
    ? `${formatUsd(stats.currentUserWithdrawnUsd)} approved`
    : `Needs ${formatUsd(stats.minimumWithdrawalUsd)}+ approved withdrawals`

  return (
    <div className="space-y-6">
      <section
        className="surface-glow overflow-hidden rounded-[30px]"
        style={{ backgroundImage: 'var(--gradient-hero-balance)' }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-[var(--text-tertiary)]">
                <Trophy className="h-4 w-4 text-[var(--glow)]" />
                Leadership board
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                Highest user withdrawals, ranked live.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
                The board ranks users by total approved withdrawals. Only users
                above the minimum withdrawal mark can appear.
              </p>
            </div>

            <div className="rounded-[26px] border border-[var(--border-soft)] bg-[var(--surface-overlay)] p-4 lg:min-w-[19rem]">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                Live loop
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">
                {refreshSeconds}s
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Auto-refreshing withdrawal rankings. {formatUpdatedAt(updatedAt)}.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[26px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--text-secondary)]">Your rank</p>
                <UsersRound className="h-5 w-5 text-[var(--glow)]" />
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-[var(--text-primary)]">
                {rankLabel}
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                {rankDetail}
              </p>
            </div>
            <div className="rounded-[26px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--text-secondary)]">Highest single withdrawal</p>
                <WalletCards className="h-5 w-5 text-emerald-300" />
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-[var(--text-primary)]">
                {formatUsd(stats.highestWithdrawalUsd)}
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Minimum board entry: {formatUsd(stats.minimumWithdrawalUsd)}
              </p>
            </div>
            <div className="rounded-[26px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--text-secondary)]">Live paid out</p>
                <Activity className="h-5 w-5 text-[var(--blue)]" />
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-[var(--text-primary)]">
                {formatUsd(stats.liveTotalWithdrawnUsd)}
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                {stats.liveUsers} users with approved withdrawals
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Top three
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
              Withdrawal podium
            </h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            <Sparkles className="h-4 w-4 text-[var(--glow)]" />
            Global withdrawal board
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {podium.map((entry) => (
            <PodiumCard key={entry.id} entry={entry} />
          ))}
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Full rankings
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
              Highest withdrawals
            </h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <RefreshCw
              className={clsx('h-4 w-4', isLoading && 'animate-spin text-[var(--glow)]')}
            />
            {isLoading ? 'Syncing rankings...' : formatUpdatedAt(updatedAt)}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Showing local withdrawal leaderboard data until the backend responds.
          </p>
        ) : null}

        <div className="mt-6 space-y-3">
          {entries.map((entry) => (
            <LeaderboardRow key={entry.id} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  )
}
