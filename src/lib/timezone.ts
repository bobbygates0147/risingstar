const LEGACY_DEFAULT_TIMEZONE = 'Africa/Lagos'
const FALLBACK_TIMEZONE = 'UTC'
const TIMEZONE_STORAGE_KEY = 'rising-star-timezone'

const COMMON_TIME_ZONES = [
  FALLBACK_TIMEZONE,
  LEGACY_DEFAULT_TIMEZONE,
  'Africa/Cairo',
  'Africa/Johannesburg',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/New_York',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Paris',
]

type IntlWithSupportedValuesOf = typeof Intl & {
  supportedValuesOf?: (key: 'timeZone') => string[]
}

function readTimeZone(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function isValidTimeZone(timeZone: string) {
  if (!timeZone) {
    return false
  }

  try {
    new Intl.DateTimeFormat(undefined, { timeZone }).format(new Date())
    return true
  } catch {
    return false
  }
}

export function getBrowserTimeZone() {
  if (typeof Intl === 'undefined') {
    return LEGACY_DEFAULT_TIMEZONE
  }

  const resolvedTimeZone = readTimeZone(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  )

  if (isValidTimeZone(resolvedTimeZone)) {
    return resolvedTimeZone
  }

  return LEGACY_DEFAULT_TIMEZONE
}

export function getStoredTimeZonePreference() {
  if (typeof window === 'undefined') {
    return ''
  }

  const storedTimeZone = readTimeZone(
    window.localStorage.getItem(TIMEZONE_STORAGE_KEY),
  )

  return isValidTimeZone(storedTimeZone) ? storedTimeZone : ''
}

export function setStoredTimeZonePreference(timeZone: string) {
  const requestedTimeZone = readTimeZone(timeZone)
  const normalizedTimeZone = isValidTimeZone(requestedTimeZone)
    ? requestedTimeZone
    : getBrowserTimeZone()

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TIMEZONE_STORAGE_KEY, normalizedTimeZone)
  }

  return normalizedTimeZone
}

export function resolvePreferredTimeZone(timeZone?: string | null) {
  const requestedTimeZone = readTimeZone(timeZone)
  const browserTimeZone = getBrowserTimeZone()

  if (
    requestedTimeZone &&
    requestedTimeZone !== LEGACY_DEFAULT_TIMEZONE &&
    isValidTimeZone(requestedTimeZone)
  ) {
    return requestedTimeZone
  }

  const storedTimeZone = getStoredTimeZonePreference()
  if (
    storedTimeZone &&
    (!requestedTimeZone || requestedTimeZone === LEGACY_DEFAULT_TIMEZONE)
  ) {
    return storedTimeZone
  }

  if (!requestedTimeZone) {
    return browserTimeZone
  }

  if (
    requestedTimeZone === LEGACY_DEFAULT_TIMEZONE &&
    browserTimeZone !== LEGACY_DEFAULT_TIMEZONE
  ) {
    return browserTimeZone
  }

  if (isValidTimeZone(requestedTimeZone)) {
    return requestedTimeZone
  }

  if (isValidTimeZone(browserTimeZone)) {
    return browserTimeZone
  }

  return FALLBACK_TIMEZONE
}

export function getTimeZoneOptions(timeZone?: string | null) {
  const requestedTimeZone = readTimeZone(timeZone)
  const supportedTimeZones =
    (Intl as IntlWithSupportedValuesOf).supportedValuesOf?.('timeZone') ||
    COMMON_TIME_ZONES

  return Array.from(
    new Set(
      [
        requestedTimeZone,
        getBrowserTimeZone(),
        ...COMMON_TIME_ZONES,
        ...supportedTimeZones,
      ].filter(isValidTimeZone),
    ),
  )
}

export function formatTimeZoneLabel(timeZone: string) {
  return timeZone.replace(/_/g, ' ')
}

export function getShortTimeZoneName(date: Date, timeZone: string) {
  const formattedParts = new Intl.DateTimeFormat(undefined, {
    timeZone,
    timeZoneName: 'short',
  }).formatToParts(date)

  return (
    formattedParts.find((part) => part.type === 'timeZoneName')?.value ||
    timeZone
  )
}

export { LEGACY_DEFAULT_TIMEZONE }
