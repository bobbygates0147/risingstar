const usdFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: 'currency',
})

const compactUsdFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
})

export function formatUsd(value: number) {
  return usdFormatter.format(value)
}

export function formatCompactUsd(value: number) {
  return compactUsdFormatter.format(value)
}
