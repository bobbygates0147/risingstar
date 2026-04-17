import { getDefaultCryptoWalletInstructions } from './crypto-wallets'
import { API_BASE_URL } from './api-base'
import {
  COUNTRY_CURRENCY_OPTIONS,
  type CountryCurrencyOption,
} from './country-currency'
import { getBrowserTimeZone } from './timezone'

const AUTH_TOKEN_KEY = 'rising-star-auth-token'
const AUTH_USER_KEY = 'rising-star-auth-user'
export const AUTH_USER_UPDATED_EVENT = 'rising-star:auth-user-updated'

type UserRole = 'user' | 'admin'
export type SignupTierId = 'tier1' | 'tier2' | 'tier3' | 'tier4'
type SignupPaymentMethod = 'crypto'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  country?: string
  countryCode?: string
  currency?: string
  currencyName?: string
  currencySymbol?: string
  bio?: string
  language?: string
  timezone?: string
  avatarUrl?: string
  notificationSettings?: {
    taskAlerts?: boolean
    securityAlerts?: boolean
    payoutAlerts?: boolean
    marketing?: boolean
  }
  walletBalance?: number
  withdrawableBalance?: number
  taskCredits?: number
  tier?: string
  streak?: number
  registrationFeeUsd?: number
  registrationPaymentMethod?: string
  registrationPaymentReference?: string
  registrationPaymentAmountUsd?: number
  registrationPaidAt?: string | null
  aiBotFeeUsd?: number
  aiBotEnabled?: boolean
  aiBotPaymentMethod?: string
  aiBotPaymentReference?: string
  aiBotVerificationStatus?: string
  aiBotVerifiedAt?: string | null
  aiBotPaymentTxHash?: string
  aiBotPaymentProofFile?: string
  aiBotActivatedAt?: string | null
  aiBotExpiresAt?: string | null
  aiBotSubscriptionMonths?: number
  aiBotLastCheckpointAt?: string | null
  aiBotNextCheckpointAt?: string | null
  aiBotDailyRunsDate?: string
  aiBotDailyRunsCount?: number
  referralCode?: string
  referredBy?: string
  createdAt?: string
  updatedAt?: string
}

type AuthResponse = {
  token: string
  user: AuthUser
}

export type SignupTier = {
  id: SignupTierId
  label: string
  feeUsd: number
}

export type SignupCountryOption = CountryCurrencyOption

export type SignupPaymentInstructions = {
  crypto: {
    btcAddress: string
    ethAddress: string
    usdtTrc20Address: string
    usdtErc20Address: string
    usdtBep20Address: string
    solAddress: string
  }
}

export type SignupConfig = {
  currency: 'USD'
  tiers: SignupTier[]
  countries: SignupCountryOption[]
  paymentMethods: SignupPaymentMethod[]
  aiBotFeeUsd: number
  paymentInstructions: SignupPaymentInstructions
}

export type SignupPayload = {
  name: string
  email: string
  password: string
  tier: SignupTierId
  paymentMethod: SignupPaymentMethod
  paymentReference: string
  paymentAmountUsd: number
  country: string
  countryCode: string
  currency: string
  currencyName?: string
  currencySymbol?: string
  referralCode?: string
  timezone?: string
}

const fallbackSignupConfig: SignupConfig = {
  currency: 'USD',
  tiers: [
    { id: 'tier1', label: 'Tier 1', feeUsd: 12.7 },
    { id: 'tier2', label: 'Tier 2', feeUsd: 25.4 },
    { id: 'tier3', label: 'Tier 3', feeUsd: 36.28 },
    { id: 'tier4', label: 'Tier 4', feeUsd: 119.99 },
  ],
  countries: COUNTRY_CURRENCY_OPTIONS,
  paymentMethods: ['crypto'],
  aiBotFeeUsd: 18.14,
  paymentInstructions: {
    crypto: getDefaultCryptoWalletInstructions(),
  },
}

function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function parseStoredUser(rawUser: string | null): AuthUser | null {
  if (!rawUser) {
    return null
  }

  try {
    const parsed = JSON.parse(rawUser) as AuthUser

    if (!parsed?.id || !parsed?.email || !parsed?.role) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function setAuthSession(payload: AuthResponse) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(AUTH_TOKEN_KEY, payload.token)
  storage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user))
  window.dispatchEvent(new CustomEvent(AUTH_USER_UPDATED_EVENT))
}

function clearAuthSession() {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.removeItem(AUTH_TOKEN_KEY)
  storage.removeItem(AUTH_USER_KEY)
  window.dispatchEvent(new CustomEvent(AUTH_USER_UPDATED_EVENT))
}

export function getAuthToken() {
  const storage = getStorage()

  if (!storage) {
    return ''
  }

  return storage.getItem(AUTH_TOKEN_KEY) ?? ''
}

export function getAuthenticatedUser() {
  const storage = getStorage()

  if (!storage) {
    return null
  }

  return parseStoredUser(storage.getItem(AUTH_USER_KEY))
}

export function getAuthenticatedEmail() {
  return getAuthenticatedUser()?.email ?? ''
}

export function isAuthenticated() {
  return Boolean(getAuthToken())
}

export function isAdmin() {
  return getAuthenticatedUser()?.role === 'admin'
}

export function resolveUserTierId(
  user?: Pick<AuthUser, 'role' | 'tier'> | null,
): SignupTierId {
  if (user?.role === 'admin') {
    return 'tier4'
  }

  const normalizedTier = user?.tier?.toString().trim().toLowerCase()

  if (!normalizedTier) {
    return 'tier1'
  }

  if (normalizedTier === 'tier2' || normalizedTier === '2' || normalizedTier === 'tier 2') {
    return 'tier2'
  }

  if (normalizedTier === 'tier3' || normalizedTier === '3' || normalizedTier === 'tier 3') {
    return 'tier3'
  }

  if (normalizedTier === 'tier4' || normalizedTier === '4' || normalizedTier === 'tier 4') {
    return 'tier4'
  }

  return 'tier1'
}

export function getCurrentUserTierId() {
  return resolveUserTierId(getAuthenticatedUser())
}

export function canAccessAdTasks(user?: Pick<AuthUser, 'role' | 'tier'> | null) {
  const tierId = resolveUserTierId(user)
  return tierId === 'tier3' || tierId === 'tier4'
}

export function canAccessSocialTasks(user?: Pick<AuthUser, 'role' | 'tier'> | null) {
  const tierId = resolveUserTierId(user)
  return tierId === 'tier2' || tierId === 'tier4'
}

export function signOut() {
  clearAuthSession()
}

export function getAuthorizedHeaders(): Record<string, string> {
  const token = getAuthToken()

  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

async function authRequest(path: 'login' | 'signup', payload: Record<string, string>) {
  const response = await fetch(`${API_BASE_URL}/api/auth/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data: unknown = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data && typeof data.message === 'string'
        ? data.message
        : 'Authentication request failed'

    throw new Error(message)
  }

  const authData = data as Partial<AuthResponse>

  if (!authData.token || !authData.user) {
    throw new Error('Invalid authentication response')
  }

  const normalized: AuthResponse = {
    token: String(authData.token),
    user: authData.user as AuthUser,
  }

  setAuthSession(normalized)

  return normalized
}

export async function login(email: string, password: string) {
  return authRequest('login', { email, password })
}

export async function signup(payload: SignupPayload) {
  const signupPayload: Record<string, string> = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    tier: payload.tier,
    paymentMethod: payload.paymentMethod,
    paymentReference: payload.paymentReference,
    paymentAmountUsd: payload.paymentAmountUsd.toFixed(2),
    country: payload.country,
    countryCode: payload.countryCode,
    currency: payload.currency,
    currencyName: payload.currencyName || payload.currency,
    currencySymbol: payload.currencySymbol || payload.currency,
    timezone: payload.timezone || getBrowserTimeZone(),
  }

  if (payload.referralCode?.trim()) {
    signupPayload.referralCode = payload.referralCode.trim()
  }

  return authRequest('signup', signupPayload)
}

export async function refreshAuthenticatedUser() {
  const token = getAuthToken()

  if (!token) {
    return null
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      ...getAuthorizedHeaders(),
    },
  })

  if (!response.ok) {
    clearAuthSession()
    return null
  }

  const data = (await response.json()) as { user?: AuthUser }

  if (!data.user) {
    clearAuthSession()
    return null
  }

  setAuthSession({ token, user: data.user })
  return data.user
}

function isSignupTier(value: unknown): value is SignupTier {
  if (!value || typeof value !== 'object') {
    return false
  }

  const tier = value as Record<string, unknown>
  return (
    (tier.id === 'tier1' || tier.id === 'tier2' || tier.id === 'tier3' || tier.id === 'tier4') &&
    typeof tier.label === 'string' &&
    typeof tier.feeUsd === 'number'
  )
}

function isPaymentMethod(value: unknown): value is SignupPaymentMethod {
  return value === 'crypto'
}

function isSignupCountryOption(value: unknown): value is SignupCountryOption {
  if (!value || typeof value !== 'object') {
    return false
  }

  const country = value as Record<string, unknown>

  return (
    typeof country.code === 'string' &&
    typeof country.name === 'string' &&
    typeof country.currency === 'string' &&
    typeof country.currencyName === 'string' &&
    typeof country.currencySymbol === 'string' &&
    typeof country.locale === 'string' &&
    typeof country.phoneCode === 'string'
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function fetchSignupConfig(): Promise<SignupConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup-config`)

    if (!response.ok) {
      throw new Error('Signup config request failed')
    }

    const data = (await response.json()) as Partial<SignupConfig>

    const tiers = Array.isArray(data.tiers)
      ? data.tiers.filter(isSignupTier)
      : fallbackSignupConfig.tiers

    const paymentMethods = Array.isArray(data.paymentMethods)
      ? data.paymentMethods.filter(isPaymentMethod)
      : fallbackSignupConfig.paymentMethods

    const countries = Array.isArray(data.countries)
      ? data.countries.filter(isSignupCountryOption)
      : fallbackSignupConfig.countries

    const aiBotFeeUsd =
      typeof data.aiBotFeeUsd === 'number'
        ? data.aiBotFeeUsd
        : fallbackSignupConfig.aiBotFeeUsd

    const fallbackInstructions = fallbackSignupConfig.paymentInstructions
    const instructionsSource = data.paymentInstructions as Partial<SignupPaymentInstructions> | undefined
    const crypto = instructionsSource?.crypto

    return {
      currency: 'USD',
      tiers: tiers.length > 0 ? tiers : fallbackSignupConfig.tiers,
      countries:
        countries.length > 0
          ? countries
          : fallbackSignupConfig.countries,
      paymentMethods:
        paymentMethods.length > 0
          ? paymentMethods
          : fallbackSignupConfig.paymentMethods,
      aiBotFeeUsd,
      paymentInstructions: {
        crypto: {
          btcAddress: isNonEmptyString(crypto?.btcAddress)
            ? crypto.btcAddress
            : fallbackInstructions.crypto.btcAddress,
          ethAddress: isNonEmptyString(crypto?.ethAddress)
            ? crypto.ethAddress
            : fallbackInstructions.crypto.ethAddress,
          usdtTrc20Address: isNonEmptyString(crypto?.usdtTrc20Address)
            ? crypto.usdtTrc20Address
            : fallbackInstructions.crypto.usdtTrc20Address,
          usdtErc20Address: isNonEmptyString(crypto?.usdtErc20Address)
            ? crypto.usdtErc20Address
            : fallbackInstructions.crypto.usdtErc20Address,
          usdtBep20Address: isNonEmptyString(crypto?.usdtBep20Address)
            ? crypto.usdtBep20Address
            : fallbackInstructions.crypto.usdtBep20Address,
          solAddress: isNonEmptyString(crypto?.solAddress)
            ? crypto.solAddress
            : fallbackInstructions.crypto.solAddress,
        },
      },
    }
  } catch {
    return fallbackSignupConfig
  }
}
