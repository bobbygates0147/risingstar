import clsx from 'clsx'
import {
  CheckCircle2,
  Copy,
  Gift,
  PackageCheck,
  Share2,
  Sparkles,
  Trophy,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  type ReferralMember,
  type ReferralReward,
  useReferralData,
} from '../hooks/use-referral-data'
import { formatUsd } from '../lib/format'
import { showToast } from '../lib/toast'

function rewardStatusTone(status: ReferralReward['status']) {
  if (status === 'unlocked') {
    return 'border-emerald-400/35 bg-emerald-500/15 text-emerald-300'
  }

  if (status === 'active') {
    return 'border-amber-400/35 bg-amber-500/15 text-amber-200'
  }

  return 'border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-tertiary)]'
}

function memberStatusTone(status: ReferralMember['status']) {
  if (status === 'Qualified') {
    return 'bg-emerald-500/15 text-emerald-300'
  }

  return 'bg-amber-500/15 text-amber-200'
}

function getRewardStatusLabel(reward: ReferralReward) {
  if (reward.status === 'unlocked') {
    return 'Unlocked'
  }

  if (reward.status === 'active') {
    return `${reward.remaining} to unlock`
  }

  return `${reward.target} referrals`
}

function StatTile({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string
  icon: typeof UsersRound
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(124,58,237,0.16)] text-[var(--glow)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--text-tertiary)]">{detail}</p>
    </div>
  )
}

function RewardCard({ reward }: { reward: ReferralReward }) {
  return (
    <article className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel-strong)] p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(59,130,246,0.14)] text-[var(--blue)]">
          {reward.status === 'unlocked' ? (
            <PackageCheck className="h-5 w-5" />
          ) : (
            <Gift className="h-5 w-5" />
          )}
        </span>
        <span
          className={clsx(
            'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
            rewardStatusTone(reward.status),
          )}
        >
          {getRewardStatusLabel(reward)}
        </span>
      </div>

      <p className="mt-5 text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
        {reward.label}
      </p>
      <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
        {reward.giftItem}
      </h3>
      <p className="mt-2 inline-flex rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
        {reward.priceRange}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {reward.badge} plus {formatUsd(reward.cashBonusUsd)} referral cashout bonus.
      </p>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>{reward.progress}% complete</span>
          <span>{reward.target} referrals</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--surface-track)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] via-[var(--glow)] to-[var(--blue)]"
            style={{ width: `${reward.progress}%` }}
          />
        </div>
      </div>
    </article>
  )
}

export function ReferralsPage() {
  const {
    code,
    error,
    isLoading,
    referrals,
    rewards,
    stats,
  } = useReferralData()
  const [copiedTarget, setCopiedTarget] = useState<'code' | 'link' | null>(null)
  const firstReward = rewards[0]
  const firstTarget = firstReward?.target || 5
  const firstGift = firstReward?.giftItem || 'gadget gift'
  const referralLink = useMemo(() => {
    const path = `/signup?ref=${encodeURIComponent(code)}`

    if (typeof window === 'undefined') {
      return path
    }

    return `${window.location.origin}${path}`
  }, [code])

  async function copyValue(target: 'code' | 'link', value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedTarget(target)
      window.setTimeout(() => setCopiedTarget(null), 1400)
      showToast({
        title: target === 'code' ? 'Referral code copied' : 'Referral link copied',
        variant: 'success',
      })
    } catch {
      showToast({
        title: 'Copy failed',
        description: value,
        variant: 'error',
      })
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.72fr)]">
        <div
          className="surface-glow overflow-hidden rounded-[26px]"
          style={{ backgroundImage: 'var(--gradient-hero-balance)' }}
        >
          <div className="p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)] lg:items-start">
              <div className="max-w-xl">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-[var(--text-tertiary)]">
                  <Sparkles className="h-4 w-4 text-[var(--glow)]" />
                  Referral squad
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  Invite {firstTarget} people. Unlock your first gift.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
                  Build your crew for bigger gadgets, milestone bonuses, and
                  referral cashouts.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-overlay)] p-3.5">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                  Your invite code
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-3 py-2.5">
                  <p className="notranslate min-w-0 flex-1 truncate font-display text-xl font-semibold text-[var(--text-primary)]">
                    {code}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyValue('code', code)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                    aria-label="Copy referral code"
                  >
                    {copiedTarget === 'code' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue('link', referralLink)}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:brightness-110"
                >
                  {copiedTarget === 'link' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  Copy invite link
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <StatTile
                detail={`${stats.totalReferrals} total signups`}
                icon={UsersRound}
                label="Qualified referrals"
                value={stats.qualifiedReferrals.toString()}
              />
              <StatTile
                detail={stats.nextRewardLabel}
                icon={Gift}
                label="Next gift"
                value={
                  stats.nextMilestoneTarget
                    ? `${stats.nextMilestoneRemaining} left`
                    : 'Complete'
                }
              />
              <StatTile
                detail={`${stats.earnedRewards} gifts unlocked`}
                icon={WalletCards}
                label="Referral cashouts"
                value={formatUsd(stats.projectedCashoutUsd)}
              />
            </div>
          </div>
        </div>

        <div className="self-start rounded-[26px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                First unlock
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold text-[var(--text-primary)]">
                {firstTarget} qualified people
              </h3>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(52,211,153,0.14)] text-emerald-300">
              <Trophy className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Tier 1 starts with {firstGift}. Each tier rotates equivalent gift
            options per account while staying inside that tier value range.
          </p>
          <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>{stats.qualifiedReferrals} qualified</span>
              <span>{firstTarget} needed</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--surface-track)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-[var(--glow)] to-[var(--blue)]"
                style={{
                  width: `${Math.min(100, Math.round((stats.qualifiedReferrals / firstTarget) * 100))}%`,
                }}
              />
            </div>
          </div>
          {error ? (
            <p className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Showing local referral data until the backend responds.
            </p>
          ) : null}
          {isLoading ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Syncing referral totals...
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Gift milestones
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
              Referral reward tiers
            </h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Every milestone counts qualified activated accounts.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} />
          ))}
        </div>
      </section>

      <section>
        <div className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Recent invites
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                Activated crew
              </h3>
            </div>
            <UsersRound className="h-6 w-6 text-[var(--glow)]" />
          </div>

          <div className="mt-6 space-y-3">
            {referrals.length === 0 ? (
              <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
                Share your invite link to start filling this list.
              </div>
            ) : (
              referrals.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--text-primary)]">
                        {member.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {member.tier} - {member.joinedLabel}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
                        memberStatusTone(member.status),
                      )}
                    >
                      {member.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
