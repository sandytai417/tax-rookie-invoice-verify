export function parseAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null

  const raw = String(value).trim()
  if (!raw || raw === '-' || raw === '—') return null

  const normalized = raw.replace(/,/g, '').replace(/[()]/g, '').replace(/[^\d.-]/g, '')
  if (!normalized || normalized === '-' || normalized === '.') return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatAmount(value: number | null, locale: string): string {
  if (value === null) return ''
  return value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
