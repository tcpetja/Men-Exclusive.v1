/** Formats integer cents as South African Rand, e.g. 449900 → "R 4 499", 449995 → "R 4 499.95". */
export function formatZAR(cents: number): string {
  const negative = cents < 0
  const abs = Math.abs(Math.round(cents))
  const rands = Math.floor(abs / 100)
  const c = abs % 100
  const grouped = String(rands).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${negative ? '-' : ''}R ${grouped}${c ? '.' + String(c).padStart(2, '0') : ''}`
}

/** Parses what a person types ("4 499", "R4,499.50", "4499.5") into cents. Returns null if not a valid amount. */
export function parseRandsToCents(input: string | null | undefined): number | null {
  if (input == null) return null
  const cleaned = String(input).replace(/[Rr\s ]/g, '').replace(/,(?=\d{3}(\D|$))/g, '').replace(',', '.')
  if (cleaned === '') return null
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  return Math.round(parseFloat(cleaned) * 100)
}

export function centsToRandsInput(cents: number | null | undefined): string {
  if (cents == null) return ''
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}
