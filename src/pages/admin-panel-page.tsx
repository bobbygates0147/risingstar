import { AlertTriangle, CheckCircle2, ShieldAlert, Users } from 'lucide-react'

const users = [
  { id: 'u1', name: 'Alex Johnson', tier: 'Tier 2', status: 'Active' },
  { id: 'u2', name: 'Mira Sol', tier: 'Tier 1', status: 'KYC Pending' },
  { id: 'u3', name: 'Nova Kade', tier: 'Tier 3', status: 'Active' },
]

const txns = [
  { id: 't1', type: 'Deposit', amount: '+$500', status: 'Completed' },
  { id: 't2', type: 'Withdrawal', amount: '-$200', status: 'Pending' },
  { id: 't3', type: 'Reward', amount: '+$12.4', status: 'Completed' },
]

const approvals = [
  { id: 'c1', campaign: 'Moonline Rush Boost', status: 'Approved' },
  { id: 'c2', campaign: 'Gallery Bloom Push', status: 'Review' },
  { id: 'c3', campaign: 'City Lights Ad', status: 'Flagged' },
]

const alerts = [
  'Unusual completion spike detected on account #A23',
  'Repeated muted-session violations on ad queue',
  'Withdrawal request above tier threshold requires manual review',
]

function statusTone(status: string) {
  if (status === 'Active' || status === 'Completed' || status === 'Approved') {
    return 'text-emerald-300'
  }
  if (status === 'Review' || status === 'Pending' || status === 'KYC Pending') {
    return 'text-amber-200'
  }
  return 'text-rose-300'
}

export function AdminPanelPage() {
  return (
    <div className="space-y-6">
      <section className="surface-glow overflow-hidden rounded-[30px] p-6" style={{ backgroundImage: 'var(--gradient-hero-placeholder)' }}>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Admin control</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
          Users, transactions, and fraud guardrails
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
          Review user integrity, campaign approvals, and suspicious wallet actions in one unified panel.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            <Users className="h-4 w-4 text-[var(--glow)]" />
            Users table
          </p>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{user.tier}</p>
                <p className={`mt-1 text-xs font-semibold uppercase ${statusTone(user.status)}`}>{user.status}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            <ShieldAlert className="h-4 w-4 text-[var(--warning)]" />
            Transactions
          </p>
          <div className="mt-4 space-y-3">
            {txns.map((txn) => (
              <div key={txn.id} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[var(--text-primary)]">{txn.type}</p>
                  <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{txn.amount}</p>
                </div>
                <p className={`mt-1 text-xs font-semibold uppercase ${statusTone(txn.status)}`}>{txn.status}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            Campaign approvals
          </p>
          <div className="mt-4 space-y-3">
            {approvals.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                <p className="font-medium text-[var(--text-primary)]">{item.campaign}</p>
                <p className={`mt-1 text-xs font-semibold uppercase ${statusTone(item.status)}`}>{item.status}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            <AlertTriangle className="h-4 w-4 text-rose-300" />
            Fraud alerts
          </p>
          <div className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <div key={alert} className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
                {alert}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
