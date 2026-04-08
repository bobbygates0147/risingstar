import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationToken = number | 'left-ellipsis' | 'right-ellipsis'

type PaginationControlsProps = {
  className?: string
  itemLabel?: string
  onPageChange: (nextPage: number) => void
  page: number
  pageSize?: number
  totalItems: number
}

function buildPaginationTokens(page: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const tokens: PaginationToken[] = [1]
  const windowStart = Math.max(2, page - 1)
  const windowEnd = Math.min(totalPages - 1, page + 1)

  if (windowStart > 2) {
    tokens.push('left-ellipsis')
  }

  for (let current = windowStart; current <= windowEnd; current += 1) {
    tokens.push(current)
  }

  if (windowEnd < totalPages - 1) {
    tokens.push('right-ellipsis')
  }

  tokens.push(totalPages)
  return tokens
}

export function PaginationControls({
  className,
  itemLabel = 'items',
  onPageChange,
  page,
  pageSize = 5,
  totalItems,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalItems <= pageSize) {
    return null
  }

  const clampedPage = Math.min(Math.max(page, 1), totalPages)
  const startIndex = (clampedPage - 1) * pageSize + 1
  const endIndex = Math.min(clampedPage * pageSize, totalItems)
  const tokens = buildPaginationTokens(clampedPage, totalPages)

  return (
    <div
      className={clsx(
        'mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        Showing {startIndex}-{endIndex} of {totalItems} {itemLabel}
      </p>

      <div className="inline-flex items-center gap-1 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-1.5">
        <button
          type="button"
          disabled={clampedPage <= 1}
          onClick={() => onPageChange(clampedPage - 1)}
          className="inline-flex h-8 items-center justify-center rounded-xl border border-transparent px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition hover:border-[var(--border-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {tokens.map((token) =>
          typeof token === 'number' ? (
            <button
              key={token}
              type="button"
              onClick={() => onPageChange(token)}
              className={clsx(
                'inline-flex h-8 min-w-8 items-center justify-center rounded-xl border px-2 text-xs font-semibold transition',
                token === clampedPage
                  ? 'border-[var(--border-strong)] bg-[rgba(124,58,237,0.18)] text-[var(--text-primary)]'
                  : 'border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
              )}
              aria-label={`Go to page ${token}`}
            >
              {token}
            </button>
          ) : (
            <span
              key={token}
              className="inline-flex h-8 min-w-7 items-center justify-center text-xs text-[var(--text-tertiary)]"
              aria-hidden
            >
              ...
            </span>
          ),
        )}

        <button
          type="button"
          disabled={clampedPage >= totalPages}
          onClick={() => onPageChange(clampedPage + 1)}
          className="inline-flex h-8 items-center justify-center rounded-xl border border-transparent px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition hover:border-[var(--border-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
