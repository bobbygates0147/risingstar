const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')

export function resolveApiMediaUrl(value?: string | null) {
  if (!value || typeof value !== 'string') {
    return ''
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`
}
