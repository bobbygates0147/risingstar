import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../lib/api-base'
import {
  COUNTRY_CURRENCY_OPTIONS,
  DEFAULT_COUNTRY_CODE,
  FALLBACK_USD_RATES,
  formatCurrencyAmount,
  getCountryOptionByCode,
  type CountryCurrencyOption,
} from '../lib/country-currency'
import { formatUsd } from '../lib/format'

type CurrencyPair = {
  local: string
  usd: string | null
}

type RatesSource = 'fallback' | 'live'

type CurrencyRatesResponse = {
  rates?: Record<string, number>
  source?: RatesSource
}

const RATES_STORAGE_KEY = 'rising-star-usd-rates'

function sanitizeRates(input: Record<string, number> | undefined) {
  if (!input || typeof input !== 'object') {
    return {}
  }

  return Object.entries(input).reduce<Record<string, number>>((accumulator, [code, rate]) => {
    const currencyCode = code.trim().toUpperCase()

    if (currencyCode && typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
      accumulator[currencyCode] = rate
    }

    return accumulator
  }, {})
}

function readCachedRates() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(RATES_STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Record<string, number>
    const sanitized = sanitizeRates(parsed)

    return Object.keys(sanitized).length > 0 ? sanitized : null
  } catch {
    return null
  }
}

function resolveCountryFromOptions(
  countryCode: string | null | undefined,
  countryOptions: CountryCurrencyOption[],
) {
  const normalizedCode = String(countryCode || DEFAULT_COUNTRY_CODE)
    .trim()
    .toUpperCase()

  return (
    countryOptions.find((option) => option.code === normalizedCode) ??
    countryOptions.find((option) => option.code === DEFAULT_COUNTRY_CODE) ??
    getCountryOptionByCode(normalizedCode)
  )
}

export function useCurrencyConverter(
  countryCode: string | null | undefined = DEFAULT_COUNTRY_CODE,
  countryOptions: CountryCurrencyOption[] = COUNTRY_CURRENCY_OPTIONS,
) {
  const options = countryOptions.length > 0 ? countryOptions : COUNTRY_CURRENCY_OPTIONS
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_USD_RATES)
  const [ratesSource, setRatesSource] = useState<RatesSource>('fallback')
  const [isRatesLoading, setIsRatesLoading] = useState(true)

  useEffect(() => {
    const cachedRates = readCachedRates()

    if (cachedRates) {
      setRates({ ...FALLBACK_USD_RATES, ...cachedRates })
      setRatesSource('live')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchRates() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/currency/rates`, {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Currency rates request failed')
        }

        const payload = (await response.json()) as CurrencyRatesResponse
        const sanitized = sanitizeRates(payload.rates)

        if (Object.keys(sanitized).length === 0) {
          throw new Error('Currency rates payload invalid')
        }

        const mergedRates = { ...FALLBACK_USD_RATES, ...sanitized }
        setRates(mergedRates)
        setRatesSource(payload.source === 'live' ? 'live' : 'fallback')

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(mergedRates))
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setRatesSource((current) => (current === 'live' ? 'live' : 'fallback'))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsRatesLoading(false)
        }
      }
    }

    fetchRates()

    return () => controller.abort()
  }, [])

  const country = useMemo(
    () => resolveCountryFromOptions(countryCode, options),
    [countryCode, options],
  )

  const convertFromUsd = useCallback(
    (usdAmount: number) => {
      const rate = rates[country.currency] ?? FALLBACK_USD_RATES[country.currency] ?? 1
      return usdAmount * rate
    },
    [country.currency, rates],
  )

  const formatFromUsd = useCallback(
    (usdAmount: number, optionsOverride?: Intl.NumberFormatOptions) =>
      formatCurrencyAmount(
        convertFromUsd(usdAmount),
        country.currency,
        country.locale,
        optionsOverride,
      ),
    [convertFromUsd, country.currency, country.locale],
  )

  const formatDualFromUsd = useCallback(
    (usdAmount: number, optionsOverride?: Intl.NumberFormatOptions): CurrencyPair => ({
      local: formatFromUsd(usdAmount, optionsOverride),
      usd: country.currency === 'USD' ? null : formatUsd(usdAmount),
    }),
    [country.currency, formatFromUsd],
  )

  return {
    country,
    countryOptions: options,
    currencyCode: country.currency,
    currencyName: country.currencyName,
    convertFromUsd,
    formatDualFromUsd,
    formatFromUsd,
    isRatesLoading,
    ratesSource,
  }
}
