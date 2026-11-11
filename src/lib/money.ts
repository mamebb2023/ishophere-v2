const CURRENCY = 'SAR'

const formatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: CURRENCY,
})

export function formatMoney(cents: number): string {
  return formatter.format(cents / 100)
}

export function priceToCents(value: string): number {
  const normalized = value.replace(/[^0-9.]/g, '')
  return Math.round(Number(normalized) * 100)
}

export function centsToPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}
