import clsx from 'clsx'
import { CheckCircle2, Info, ShieldAlert, TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  GLOBAL_TOAST_EVENT,
  type ToastPayload,
  type ToastVariant,
} from '../lib/toast'

type ToastItem = {
  id: string
  title: string
  description: string
  durationMs: number
  variant: ToastVariant
}

const MAX_TOASTS = 4
const DEFAULT_DURATION_MS = 7000

function toToastItem(payload: ToastPayload): ToastItem {
  return {
    id: payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    title: payload.title,
    description: payload.description || '',
    durationMs:
      Number.isFinite(payload.durationMs) && (payload.durationMs ?? 0) > 800
        ? payload.durationMs!
        : DEFAULT_DURATION_MS,
    variant: payload.variant || 'info',
  }
}

function variantClassName(variant: ToastVariant) {
  if (variant === 'success') {
    return 'border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(124,58,237,0.28),rgba(59,130,246,0.18))]'
  }

  if (variant === 'warning') {
    return 'border-amber-300/40 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(124,58,237,0.14))]'
  }

  if (variant === 'error') {
    return 'border-rose-300/40 bg-[linear-gradient(135deg,rgba(244,63,94,0.2),rgba(124,58,237,0.12))]'
  }

  return 'border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(59,130,246,0.2),rgba(124,58,237,0.16))]'
}

function progressClassName(variant: ToastVariant) {
  if (variant === 'success') {
    return 'from-[var(--glow)] via-[var(--blue)] to-[var(--purple)]'
  }

  if (variant === 'warning') {
    return 'from-amber-200 via-amber-400 to-[var(--purple)]'
  }

  if (variant === 'error') {
    return 'from-rose-300 via-rose-400 to-[var(--purple)]'
  }

  return 'from-[var(--blue)] via-[var(--glow)] to-[var(--purple)]'
}

function VariantIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return <CheckCircle2 className="h-4 w-4 text-[var(--glow)]" />
  }

  if (variant === 'warning') {
    return <TriangleAlert className="h-4 w-4 text-amber-300" />
  }

  if (variant === 'error') {
    return <ShieldAlert className="h-4 w-4 text-rose-300" />
  }

  return <Info className="h-4 w-4 text-[var(--glow)]" />
}

export function GlobalToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  function removeToast(id: string) {
    setToasts((previous) => previous.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<ToastPayload>
      const detail = customEvent.detail

      if (!detail || !detail.title) {
        return
      }

      const nextToast = toToastItem(detail)

      setToasts((previous) => [nextToast, ...previous].slice(0, MAX_TOASTS))

      const timer = window.setTimeout(() => {
        removeToast(nextToast.id)
      }, nextToast.durationMs)

      timersRef.current.set(nextToast.id, timer)
    }

    window.addEventListener(GLOBAL_TOAST_EVENT, handleToast as EventListener)

    return () => {
      window.removeEventListener(GLOBAL_TOAST_EVENT, handleToast as EventListener)
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[130] sm:inset-x-auto sm:right-4 sm:top-4">
      <div className="flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <article
            key={toast.id}
            className={clsx(
              'global-toast-card pointer-events-auto rounded-2xl border px-4 py-3 shadow-[var(--shadow-popup)] backdrop-blur-xl animate-[toast-enter_380ms_cubic-bezier(0.22,1,0.36,1)]',
              variantClassName(toast.variant),
            )}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-1.5">
                <VariantIcon variant={toast.variant} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold text-[var(--text-primary)]">
                  {toast.title}
                </p>
                {toast.description ? (
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="global-toast-progress">
              <span
                className={clsx(
                  'global-toast-progress__bar bg-gradient-to-r',
                  progressClassName(toast.variant),
                )}
                style={{ animationDuration: `${toast.durationMs}ms` }}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
