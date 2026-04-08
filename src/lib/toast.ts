export type ToastVariant = 'success' | 'info' | 'warning' | 'error'

export type ToastPayload = {
  id?: string
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

export const GLOBAL_TOAST_EVENT = 'rising-star:toast'

function buildToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function showToast(payload: ToastPayload) {
  if (typeof window === 'undefined') {
    return
  }

  const detail: ToastPayload = {
    ...payload,
    id: payload.id || buildToastId(),
  }

  window.dispatchEvent(new CustomEvent<ToastPayload>(GLOBAL_TOAST_EVENT, { detail }))
}
