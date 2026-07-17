import { round2 } from './numbers'
import type { ComputedOrderLineRow, OrderLineRow, RowStatus, TolerancePreset } from '@/types'

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

export function computeTheoreticalAmount(
  quantity: number | null,
  unitPrice: number | null,
): number | null {
  if (quantity === null || unitPrice === null) return null
  return round2(quantity * unitPrice)
}

function resolveStatus(
  quantity: number | null,
  unitPrice: number | null,
  amount: number | null,
  theoreticalAmount: number | null,
  tolerance: number,
): RowStatus {
  const values = [quantity, unitPrice, amount]
  const filled = values.filter((value) => value !== null)

  if (filled.length === 0) return 'empty'
  if (quantity === null || unitPrice === null || amount === null || theoreticalAmount === null) {
    return 'incomplete'
  }

  const difference = round2(amount - theoreticalAmount)
  const absDiff = Math.abs(difference)

  if (absDiff === 0) return 'exact'
  if (absDiff <= tolerance) return 'within_tolerance'
  return 'out_of_tolerance'
}

export function isRowEmpty(row: OrderLineRow): boolean {
  return (
    !row.createdDate &&
    !row.orderId &&
    !row.itemName &&
    row.quantity === null &&
    row.unitPrice === null &&
    row.amount === null &&
    !row.remarks
  )
}

function hasLineItemData(row: OrderLineRow): boolean {
  return (
    Boolean(row.itemName) ||
    row.quantity !== null ||
    row.unitPrice !== null ||
    row.amount !== null ||
    Boolean(row.remarks)
  )
}

function hasRowContent(row: OrderLineRow): boolean {
  return hasLineItemData(row) || Boolean(row.orderId) || Boolean(row.createdDate)
}

export function resolveOrderLineFields(rows: OrderLineRow[]): OrderLineRow[] {
  let lastDate: string | null = null
  let lastOrderId: string | null = null

  return rows.map((row) => {
    if (isRowEmpty(row)) return row

    const createdDate = row.createdDate ?? (hasRowContent(row) ? lastDate : null)
    const orderId = row.orderId ?? (hasLineItemData(row) ? lastOrderId : null)

    if (createdDate) lastDate = createdDate
    if (orderId) lastOrderId = orderId

    return { ...row, createdDate, orderId }
  })
}

export function ensureTrailingRows(
  rows: OrderLineRow[],
  minEmpty = 5,
  minTotal = 20,
): OrderLineRow[] {
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

export function computeRow(
  row: OrderLineRow,
  index: number,
  tolerance: number,
): ComputedOrderLineRow {
  const theoreticalAmount = computeTheoreticalAmount(row.quantity, row.unitPrice)
  const difference =
    row.amount !== null && theoreticalAmount !== null
      ? round2(row.amount - theoreticalAmount)
      : null

  return {
    ...row,
    index,
    theoreticalAmount,
    difference,
    status: resolveStatus(
      row.quantity,
      row.unitPrice,
      row.amount,
      theoreticalAmount,
      tolerance,
    ),
  }
}

export function computeRows(rows: OrderLineRow[], tolerance: number): ComputedOrderLineRow[] {
  return resolveOrderLineFields(rows).map((row, index) => computeRow(row, index + 1, tolerance))
}

export function summarizeRows(rows: ComputedOrderLineRow[]) {
  const activeRows = rows.filter((row) => row.status !== 'empty')

  const orderIds = new Set(
    activeRows.map((row) => row.orderId).filter((id): id is string => Boolean(id)),
  )

  return {
    lineCount: activeRows.length,
    orderCount: orderIds.size,
    amountTotal: activeRows.reduce((sum, row) => sum + (row.amount ?? 0), 0),
    anomalyCount: activeRows.filter((row) => row.status === 'out_of_tolerance').length,
  }
}

export function createEmptyRow(id?: string): OrderLineRow {
  return {
    id: id ?? crypto.randomUUID(),
    createdDate: null,
    orderId: null,
    itemName: null,
    quantity: null,
    unitPrice: null,
    amount: null,
    remarks: null,
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

export function getRowSpan(
  rows: ComputedOrderLineRow[],
  rowIndex: number,
  field: 'createdDate' | 'orderId',
): number {
  const current = rows[rowIndex]
  const value = current[field]
  if (!value) return 1

  if (rowIndex > 0) {
    const previous = rows[rowIndex - 1]
    if (field === 'orderId') {
      if (previous.orderId === value && previous.createdDate === current.createdDate) return 0
    } else if (previous.createdDate === value) {
      return 0
    }
  }

  let span = 1
  for (let i = rowIndex + 1; i < rows.length; i++) {
    const next = rows[i]
    if (field === 'orderId') {
      if (next.orderId === value && next.createdDate === current.createdDate) span++
      else break
    } else if (next.createdDate === value) {
      span++
    } else {
      break
    }
  }

  return span
}
