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

export function computeTheoreticalTax(
  net: number | null,
  taxRate: number,
): number | null {
  if (net === null) return null
  return round2(net * (taxRate / 100))
}

function resolveStatus(
  net: number | null,
  tax: number | null,
  theoreticalTax: number | null,
  tolerance: number,
): RowStatus {
  const values = [net, tax]
  const filled = values.filter((value) => value !== null)

  if (filled.length === 0) return 'empty'
  if (net === null || tax === null || theoreticalTax === null) return 'incomplete'

  const difference = round2(tax - theoreticalTax)
  const absDiff = Math.abs(difference)

  if (absDiff === 0) return 'exact'
  if (absDiff <= tolerance) return 'within_tolerance'
  return 'out_of_tolerance'
}

export function computeRow(
  row: InvoiceRow,
  index: number,
  taxRate: number,
  tolerance: number,
): ComputedInvoiceRow {
  const theoreticalTax = computeTheoreticalTax(row.net, taxRate)
  const difference =
    row.tax !== null && theoreticalTax !== null ? round2(row.tax - theoreticalTax) : null

  return {
    ...row,
    index,
    theoreticalTax,
    difference,
    status: resolveStatus(row.net, row.tax, theoreticalTax, tolerance),
  }
}

export function computeRows(
  rows: InvoiceRow[],
  taxRate: number,
  tolerance: number,
): ComputedInvoiceRow[] {
  return rows.map((row, index) => computeRow(row, index + 1, taxRate, tolerance))
}

export function summarizeRows(rows: ComputedInvoiceRow[]) {
  const activeRows = rows.filter((row) => row.status !== 'empty')

  return {
    netTotal: activeRows.reduce((sum, row) => sum + (row.net ?? 0), 0),
    taxTotal: activeRows.reduce((sum, row) => sum + (row.tax ?? 0), 0),
    grossTotal: activeRows.reduce((sum, row) => sum + (row.gross ?? 0), 0),
    anomalyCount: activeRows.filter((row) => row.status === 'out_of_tolerance').length,
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

export function rowsFromMatrix(
  matrix: Array<Array<number | null>>,
): InvoiceRow[] {
  return matrix.map((cells) => ({
    id: crypto.randomUUID(),
    net: cells[0] ?? null,
    tax: cells[1] ?? null,
    gross: cells[2] ?? null,
  }))
}

export function parseClipboardMatrix(text: string): Array<Array<number | null>> {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.length > 0)

  return lines.map((line) => {
    const cells = line.split('\t').map((cell) => {
      const raw = cell.trim()
      if (!raw) return null
      const normalized = raw.replace(/,/g, '')
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : null
    })
    return cells
  })
}
