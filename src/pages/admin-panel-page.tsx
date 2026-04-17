import {
  CheckCircle2,
  Database,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PaginationControls } from '../components/pagination-controls'
import { useAdminOverview } from '../hooks/use-admin-overview'
import { formatUsd } from '../lib/format'

function statusTone(status: string) {
  if (
    status === 'Active' ||
    status === 'Completed' ||
    status === 'approved' ||
    status === 'verified'
  ) {
    return 'text-emerald-300'
  }

  if (status === 'pending' || status === 'Pending' || status === 'unverified') {
    return 'text-amber-200'
  }

  return 'text-rose-300'
}

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

function formatMethod(value: string) {
  if (value === 'crypto') {
    return 'Crypto Wallet'
  }

  return 'Crypto Wallet'
}

export function AdminPanelPage() {
  const PAGE_SIZE = 5
  const {
    overview,
    isLoading,
    isBusy,
    error,
    message,
    approveWithdrawal,
    rejectWithdrawal,
    approveTaskPack,
    rejectTaskPack,
    verifyAIBot,
    rejectAIBot,
    approveRegistration,
    rejectRegistration,
  } = useAdminOverview()

  const { users, transactions, withdrawals, taskPacks, stats } = overview
  const [usersPage, setUsersPage] = useState(1)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [withdrawalsPage, setWithdrawalsPage] = useState(1)
  const [taskPacksPage, setTaskPacksPage] = useState(1)

  const usersPageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const transactionsPageCount = Math.max(
    1,
    Math.ceil(transactions.length / PAGE_SIZE),
  )
  const withdrawalsPageCount = Math.max(
    1,
    Math.ceil(withdrawals.length / PAGE_SIZE),
  )
  const taskPacksPageCount = Math.max(1, Math.ceil(taskPacks.length / PAGE_SIZE))

  useEffect(() => {
    setUsersPage((current) => Math.min(current, usersPageCount))
  }, [usersPageCount])

  useEffect(() => {
    setTransactionsPage((current) => Math.min(current, transactionsPageCount))
  }, [transactionsPageCount])

  useEffect(() => {
    setWithdrawalsPage((current) => Math.min(current, withdrawalsPageCount))
  }, [withdrawalsPageCount])

  useEffect(() => {
    setTaskPacksPage((current) => Math.min(current, taskPacksPageCount))
  }, [taskPacksPageCount])

  const paginatedUsers = useMemo(() => {
    const startIndex = (usersPage - 1) * PAGE_SIZE
    return users.slice(startIndex, startIndex + PAGE_SIZE)
  }, [users, usersPage])

  const paginatedTransactions = useMemo(() => {
    const startIndex = (transactionsPage - 1) * PAGE_SIZE
    return transactions.slice(startIndex, startIndex + PAGE_SIZE)
  }, [transactions, transactionsPage])

  const paginatedWithdrawals = useMemo(() => {
    const startIndex = (withdrawalsPage - 1) * PAGE_SIZE
    return withdrawals.slice(startIndex, startIndex + PAGE_SIZE)
  }, [withdrawals, withdrawalsPage])

  const paginatedTaskPacks = useMemo(() => {
    const startIndex = (taskPacksPage - 1) * PAGE_SIZE
    return taskPacks.slice(startIndex, startIndex + PAGE_SIZE)
  }, [taskPacks, taskPacksPage])

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          Admin Operations
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
          Admin Control Center
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
          Manage users, payout transactions, and withdrawal approvals from one
          admin-only dashboard.
        </p>
        {isLoading && (
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Loading admin data
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
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <article className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Total Users
            </p>
            <Users className="h-4 w-4 text-[var(--glow)]" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {stats.totalUsers}
          </p>
        </article>

        <article className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Pending Deposits
            </p>
            <ShieldAlert className="h-4 w-4 text-amber-200" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {stats.pendingRegistrations ?? 0}
          </p>
        </article>

        <article className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Active Users
            </p>
            <UserCheck className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {stats.activeUsers}
          </p>
        </article>

        <article className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Task Catalog
            </p>
            <Database className="h-4 w-4 text-[var(--blue)]" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {stats.totalTasks}
          </p>
        </article>

        <article className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Payout Events
            </p>
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {stats.totalTransactions}
          </p>
        </article>

        <article className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Pending Withdrawals
            </p>
            <ShieldAlert className="h-4 w-4 text-amber-200" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {stats.pendingWithdrawals}
          </p>
        </article>

        <article className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Pending Task Packs
            </p>
            <ShieldAlert className="h-4 w-4 text-amber-200" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {stats.pendingTaskPacks ?? 0}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)]">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            <Users className="h-4 w-4 text-[var(--glow)]" />
            Registered Users
          </p>

          {users.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-5 text-sm text-[var(--text-secondary)]">
              No users yet.
            </div>
          ) : (
            <>
              <div className="thin-scrollbar mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Tier</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Registration Deposit</th>
                      <th className="px-3 py-2 font-medium">AI Bot</th>
                      <th className="px-3 py-2 font-medium">AI Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)]"
                      >
                        <td className="px-3 py-3 font-medium text-[var(--text-primary)]">
                          {user.name}
                        </td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">{user.email}</td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">{user.tier}</td>
                        <td
                          className={`px-3 py-3 text-xs font-semibold uppercase ${statusTone(user.status)}`}
                        >
                          {user.status}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex min-w-48 flex-col gap-2">
                            <span
                              className={`text-xs font-semibold uppercase ${statusTone(user.registrationVerificationStatus)}`}
                            >
                              {user.registrationVerificationStatus}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                              {formatUsd(user.registrationPaymentAmountUsd)}
                            </span>
                            {user.registrationPaymentReference ? (
                              <span className="break-all text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                                {user.registrationPaymentReference}
                              </span>
                            ) : null}
                            <span className="text-[11px] text-[var(--text-tertiary)]">
                              {formatDateTime(user.registrationPaymentSubmittedAt)}
                            </span>
                            {user.registrationVerificationStatus === 'pending' && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => approveRegistration(user.id)}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => rejectRegistration(user.id)}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-400/35 bg-rose-500/10 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td
                          className={`px-3 py-3 text-xs font-semibold uppercase ${statusTone(user.aiBotStatus)}`}
                        >
                          {user.aiBotStatus}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs font-semibold uppercase ${statusTone(user.aiBotVerificationStatus)}`}
                            >
                              {user.aiBotVerificationStatus === 'unverified'
                                ? 'Not Verified'
                                : user.aiBotVerificationStatus === 'verified'
                                  ? 'Verified'
                                  : 'Rejected'}
                            </span>
                            {user.aiBotPaymentTxHash && (
                              <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                                {user.aiBotPaymentTxHash.slice(0, 10)}…
                                {user.aiBotPaymentTxHash.slice(-6)}
                              </span>
                            )}
                            {user.aiBotProofUrl && (
                              <a
                                href={user.aiBotProofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--blue)]"
                              >
                                View proof
                              </a>
                            )}
                            {user.aiBotStatus === 'Active' &&
                              user.aiBotVerificationStatus === 'unverified' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => verifyAIBot(user.id)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Verify
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => rejectAIBot(user.id)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-400/35 bg-rose-500/10 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Reject
                                  </button>
                                </>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                itemLabel="users"
                onPageChange={setUsersPage}
                page={usersPage}
                totalItems={users.length}
              />
            </>
          )}
        </article>

        <article className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)]">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            Recent Transactions
          </p>
          <div className="mt-4 space-y-3">
            {transactions.length === 0 && (
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                No payout transactions yet.
              </div>
            )}

            {paginatedTransactions.map((txn) => (
              <div
                key={txn.id}
                className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-medium text-[var(--text-primary)]">{txn.type}</p>
                  <p className="font-display text-lg font-semibold text-emerald-300">
                    {txn.amount}
                  </p>
                </div>
                <p className={`mt-1 text-xs font-semibold uppercase ${statusTone(txn.status)}`}>
                  {txn.status}
                </p>
              </div>
            ))}
            <PaginationControls
              itemLabel="transactions"
              onPageChange={setTransactionsPage}
              page={transactionsPage}
              totalItems={transactions.length}
            />
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)]">
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
          <ShieldAlert className="h-4 w-4 text-amber-200" />
          Withdrawal Requests
        </p>

        <div className="mt-4 space-y-3">
          {withdrawals.length === 0 && (
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-5 text-sm text-[var(--text-secondary)]">
              No withdrawal requests available.
            </div>
          )}

          {paginatedWithdrawals.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{request.userName}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">{request.userEmail}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {formatMethod(request.paymentMethod)}
                    {request.paymentReference ? ` | ${request.paymentReference}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">
                    {formatUsd(request.amount)}
                  </p>
                  <p className={`mt-1 text-xs font-semibold uppercase ${statusTone(request.status)}`}>
                    {request.status}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-tertiary)]">
                  Requested: {formatDateTime(request.requestedAt)}
                  {request.processedAt ? ` | Processed: ${formatDateTime(request.processedAt)}` : ''}
                </p>

                {request.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => approveWithdrawal(request.id)}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => rejectWithdrawal(request.id)}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
          <PaginationControls
            itemLabel="requests"
            onPageChange={setWithdrawalsPage}
            page={withdrawalsPage}
            totalItems={withdrawals.length}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)]">
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
          <ShieldAlert className="h-4 w-4 text-amber-200" />
          Task Pack Purchases
        </p>

        <div className="mt-4 space-y-3">
          {taskPacks.length === 0 && (
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-5 text-sm text-[var(--text-secondary)]">
              No task pack purchases available.
            </div>
          )}

          {paginatedTaskPacks.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{request.userName}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">{request.userEmail}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {request.packLabel} • {request.tasks} credits
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {request.paymentMethod.toUpperCase()}
                    {request.paymentNetwork ? ` | ${request.paymentNetwork}` : ''}
                    {request.paymentTxHash ? ` | ${request.paymentTxHash}` : ''}
                  </p>
                  {request.proofUrl && (
                    <a
                      href={request.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-[var(--blue)]"
                    >
                      View proof
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">
                    {formatUsd(request.priceUsd)}
                  </p>
                  <p className={`mt-1 text-xs font-semibold uppercase ${statusTone(request.status)}`}>
                    {request.status}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-tertiary)]">
                  Requested: {formatDateTime(request.requestedAt)}
                  {request.processedAt ? ` | Processed: ${formatDateTime(request.processedAt)}` : ''}
                </p>

                {request.status === 'Pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => approveTaskPack(request.id)}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => rejectTaskPack(request.id)}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
          <PaginationControls
            itemLabel="task packs"
            onPageChange={setTaskPacksPage}
            page={taskPacksPage}
            totalItems={taskPacks.length}
          />
        </div>
      </section>
    </div>
  )
}
