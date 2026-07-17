import { round2 } from './numbers'
import type { ComputedInvoiceRow, InvoiceRow, RowStatus, TolerancePreset } from '@/types'

export function getToleranceValue(preset: TolerancePreset, customValue: number): number {
  switch (preset) {
    case '0':
      return 0
    case '0.01':
      return 0.01
    case '0.5':
      return 0.5
    case '1':
      return 1
    case 'custom':
      return Math.max(0, customValue)
    default:
      return 0.01
  }
}

function rateDecimal(taxRatePercent: number): number {
  return taxRatePercent / 100
}

/** C: 理論未稅額 = B - B/(1+稅率) */
export function computeTheoreticalNet(tax: number | null, taxRatePercent: number): number | null {
  if (tax === null) return null
  const rate = rateDecimal(taxRatePercent)
  return round2(tax - tax / (1 + rate))
}

/** D: 理論稅額 = A * 稅率 */
export function computeTheoreticalTax(net: number | null, taxRatePercent: number): number | null {
  if (net === null) return null
  return round2(net * rateDecimal(taxRatePercent))
}

/** F: 理論總價 = C + D */
export function computeTheoreticalGross(
  theoreticalNet: number | null,
  theoreticalTax: number | null,
): number | null {
  if (theoreticalNet === null || theoreticalTax === null) return null
  return round2(theoreticalNet + theoreticalTax)
}

function withinTolerance(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(round2(actual - expected)) <= tolerance
}

function resolveStatus(
  row: InvoiceRow,
  theoreticalNet: number | null,
  theoreticalTax: number | null,
  theoreticalGross: number | null,
  tolerance: number,
): RowStatus {
  const filled = [row.net, row.tax, row.gross].filter((value) => value !== null)
  if (filled.length === 0) return 'empty'

  const comparisons: Array<[number | null, number | null]> = [
    [row.net, theoreticalNet],
    [row.tax, theoreticalTax],
    [row.gross, theoreticalGross],
  ]

  const completePairs = comparisons.filter(
    ([actual, expected]) => actual !== null && expected !== null,
  ) as Array<[number, number]>

  if (completePairs.length === 0) return 'incomplete'

  const allExact = completePairs.every(([actual, expected]) => round2(actual - expected) === 0)
  if (allExact) return 'exact'

  const allWithin = completePairs.every(([actual, expected]) =>
    withinTolerance(actual, expected, tolerance),
  )
  if (allWithin) return 'within_tolerance'

  return 'out_of_tolerance'
}

export function computeRow(
  row: InvoiceRow,
  index: number,
  taxRatePercent: number,
  tolerance: number,
): ComputedInvoiceRow {
  const theoreticalNet = computeTheoreticalNet(row.tax, taxRatePercent)
  const theoreticalTax = computeTheoreticalTax(row.net, taxRatePercent)
  const theoreticalGross = computeTheoreticalGross(theoreticalNet, theoreticalTax)

  return {
    ...row,
    index,
    theoreticalNet,
    theoreticalTax,
    theoreticalGross,
    status: resolveStatus(row, theoreticalNet, theoreticalTax, theoreticalGross, tolerance),
  }
}

export function isRowEmpty(row: InvoiceRow): boolean {
  return row.net === null && row.tax === null && row.gross === null
}

export function ensureTrailingRows(
  rows: InvoiceRow[],
  minEmpty = 5,
  minTotal = 20,
): InvoiceRow[] {
  const next = [...rows]
  let trailingEmpty = 0

  for (let index = next.length - 1; index >= 0; index--) {
    if (!isRowEmpty(next[index])) break
    trailingEmpty++
  }

  while (trailingEmpty < minEmpty || next.length < minTotal) {
    next.push(createEmptyRow())
    trailingEmpty++
  }

  return next
}

export function createTotalRow(rows: ComputedInvoiceRow[]): ComputedInvoiceRow {
  const active = rows.filter((row) => row.status !== 'empty')

  const sum = (pick: (row: ComputedInvoiceRow) => number | null) =>
    round2(active.reduce((acc, row) => acc + (pick(row) ?? 0), 0))

  const net = active.some((row) => row.net !== null) ? sum((row) => row.net) : null
  const tax = active.some((row) => row.tax !== null) ? sum((row) => row.tax) : null
  const gross = active.some((row) => row.gross !== null) ? sum((row) => row.gross) : null
  const theoreticalNet = active.some((row) => row.theoreticalNet !== null)
    ? sum((row) => row.theoreticalNet)
    : null
  const theoreticalTax = active.some((row) => row.theoreticalTax !== null)
    ? sum((row) => row.theoreticalTax)
    : null
  const theoreticalGross = active.some((row) => row.theoreticalGross !== null)
    ? sum((row) => row.theoreticalGross)
    : null

  return {
    id: '__total__',
    index: 0,
    net,
    tax,
    gross,
    theoreticalNet,
    theoreticalTax,
    theoreticalGross,
    status: 'total',
    isTotalRow: true,
  }
}

export function computeRows(
  rows: InvoiceRow[],
  taxRatePercent: number,
  tolerance: number,
): ComputedInvoiceRow[] {
  const dataRows = rows.map((row, index) =>
    computeRow(row, index + 1, taxRatePercent, tolerance),
  )
  return [createTotalRow(dataRows), ...dataRows]
}

export function summarizeRows(rows: ComputedInvoiceRow[]) {
  const dataRows = rows.filter((row) => !row.isTotalRow && row.status !== 'empty')

  return {
    rowCount: dataRows.length,
    anomalyCount: dataRows.filter((row) => row.status === 'out_of_tolerance').length,
    netTotal: dataRows.reduce((sum, row) => sum + (row.net ?? 0), 0),
    taxTotal: dataRows.reduce((sum, row) => sum + (row.tax ?? 0), 0),
    grossTotal: dataRows.reduce((sum, row) => sum + (row.gross ?? 0), 0),
  }
}

export function createEmptyRow(id?: string): InvoiceRow {
  return {
    id: id ?? crypto.randomUUID(),
    net: null,
    tax: null,
    gross: null,
  }
}

export function parseClipboardMatrix(text: string): string[][] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t').map((cell) => cell.trim()))
}
