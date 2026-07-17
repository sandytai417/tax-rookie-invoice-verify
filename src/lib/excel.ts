import * as XLSX from 'xlsx'
import { parseAmount } from './numbers'
import type { ColumnMapping, OrderLineRow, ParsedWorkbook, SheetData } from '@/types'

const HEADER_ALIASES: Record<keyof ColumnMapping, string[]> = {
  createdDate: ['建立日期', '日期', 'created date', 'date'],
  orderId: ['單號', '案件編號', '訂單編號', 'order id', 'order no', 'order number'],
  itemName: ['品名', '項目', '品項', 'item', 'item name', 'description'],
  quantity: ['數量', 'qty', 'quantity'],
  unitPrice: ['單價', 'unit price', 'price'],
  amount: ['金額', '小計', 'amount', 'subtotal', 'total'],
  remarks: ['備註', 'remark', 'remarks', 'note', 'notes'],
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

function applyMergedCells(matrix: string[][], merges: XLSX.Range[] | undefined): string[][] {
  if (!merges?.length) return matrix

  const result = matrix.map((row) => [...row])

  for (const merge of merges) {
    const value = String(result[merge.s.r]?.[merge.s.c] ?? '').trim()
    if (!value) continue

    for (let row = merge.s.r; row <= merge.e.r; row++) {
      if (!result[row]) result[row] = []
      for (let col = merge.s.c; col <= merge.e.c; col++) {
        result[row][col] = value
      }
    }
  }

  return result
}

function forwardFillColumn(rows: string[][], columnIndex: number): void {
  if (columnIndex < 0) return

  let lastValue = ''
  for (const row of rows) {
    const value = row[columnIndex]?.trim() ?? ''
    if (value) {
      lastValue = value
      row[columnIndex] = value
    } else if (lastValue) {
      row[columnIndex] = lastValue
    }
  }
}

function sheetToData(sheet: XLSX.WorkSheet): SheetData {
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  })

  if (matrix.length === 0) {
    return { headers: [], rows: [] }
  }

  const stringMatrix = matrix.map((row) => row.map((cell) => String(cell ?? '').trim()))
  const filledMatrix = applyMergedCells(stringMatrix, sheet['!merges'])

  const headerRow = filledMatrix[0]
  const hasHeader = headerRow.some(Boolean)
  const headers = hasHeader
    ? headerRow.map((header, index) => header || `Column ${String.fromCharCode(65 + index)}`)
    : headerRow.map((_, index) => `Column ${String.fromCharCode(65 + index)}`)

  const dataRows = (hasHeader ? filledMatrix.slice(1) : filledMatrix).map((row) =>
    headers.map((_, index) => String(row[index] ?? '').trim()),
  )

  const mapping = suggestColumnMapping(headers)
  const createdDateIndex = mapping.createdDate ? headers.indexOf(mapping.createdDate) : -1
  const orderIdIndex = mapping.orderId ? headers.indexOf(mapping.orderId) : -1

  forwardFillColumn(dataRows, createdDateIndex)
  forwardFillColumn(dataRows, orderIdIndex)

  return { headers, rows: dataRows }
}

export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    createdDate: null,
    orderId: null,
    itemName: null,
    quantity: null,
    unitPrice: null,
    amount: null,
    remarks: null,
  }

  for (const header of headers) {
    const normalized = normalizeHeader(header)
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
      [keyof ColumnMapping, string[]]
    >) {
      if (mapping[field]) continue
      if (aliases.some((alias) => normalizeHeader(alias) === normalized)) {
        mapping[field] = header
      }
    }
  }

  return mapping
}

export async function parseExcelFile(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  const sheets: Record<string, SheetData> = {}
  for (const name of workbook.SheetNames) {
    sheets[name] = sheetToData(workbook.Sheets[name])
  }

  return {
    sheetNames: workbook.SheetNames,
    sheets,
  }
}

export function mapSheetToRows(sheet: SheetData, mapping: ColumnMapping): OrderLineRow[] {
  const headerIndex = (header: string | null) => (header ? sheet.headers.indexOf(header) : -1)

  const indices = {
    createdDate: headerIndex(mapping.createdDate),
    orderId: headerIndex(mapping.orderId),
    itemName: headerIndex(mapping.itemName),
    quantity: headerIndex(mapping.quantity),
    unitPrice: headerIndex(mapping.unitPrice),
    amount: headerIndex(mapping.amount),
    remarks: headerIndex(mapping.remarks),
  }

  const cellValue = (row: string[], index: number) => (index >= 0 ? row[index]?.trim() || null : null)

  return sheet.rows
    .map((row) => ({
      id: crypto.randomUUID(),
      createdDate: cellValue(row, indices.createdDate),
      orderId: cellValue(row, indices.orderId),
      itemName: cellValue(row, indices.itemName),
      quantity: indices.quantity >= 0 ? parseAmount(row[indices.quantity]) : null,
      unitPrice: indices.unitPrice >= 0 ? parseAmount(row[indices.unitPrice]) : null,
      amount: indices.amount >= 0 ? parseAmount(row[indices.amount]) : null,
      remarks: cellValue(row, indices.remarks),
    }))
    .filter(
      (row) =>
        row.createdDate ||
        row.orderId ||
        row.itemName ||
        row.quantity !== null ||
        row.unitPrice !== null ||
        row.amount !== null ||
        row.remarks,
    )
}

export function previewRows(sheet: SheetData, limit = 8): string[][] {
  return sheet.rows.slice(0, limit)
}
