import * as XLSX from 'xlsx'
import { parseAmount } from './numbers'
import type {
  ColumnMapping,
  ComputedInvoiceRow,
  InvoiceRow,
  Locale,
  ParsedWorkbook,
  SheetData,
} from '@/types'

const HEADER_ALIASES: Record<keyof ColumnMapping, string[]> = {
  net: ['未稅額', '未稅金額', '未稅', 'net', 'net amount'],
  tax: ['稅額', '稅金', 'tax', 'tax amount'],
  gross: ['總價', '含稅金額', '含稅', '小計', '金額', 'gross', 'total', 'amount'],
}

const EXPORT_HEADERS_ZH = [
  '#',
  '未稅額',
  '稅額',
  '總價',
  '理論未稅額',
  '理論稅額',
  '理論總價',
  '差異',
  '問題',
] as const

const EXPORT_HEADERS_EN = [
  '#',
  'Net',
  'Tax',
  'Total',
  'Expected Net',
  'Expected Tax',
  'Expected Total',
  'Diff',
  'Issue',
] as const

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

/** Computed / theoretical columns must never map into editable net/tax/gross. */
export function isLockedComputedHeader(header: string): boolean {
  const normalized = normalizeHeader(header)
  return /理論|theoretical|expectednet|expectedtax|expectedtotal|expectedgross|差異|difference|問題|issue/.test(
    normalized,
  )
}

/** Headers eligible for mapping to editable invoice fields. */
export function editableImportHeaders(headers: string[]): string[] {
  return headers.filter((header) => !isLockedComputedHeader(header))
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
  const headerRow = stringMatrix[0]
  const hasHeader = headerRow.some(Boolean)
  const headers = hasHeader
    ? headerRow.map((header, index) => header || `Column ${String.fromCharCode(65 + index)}`)
    : headerRow.map((_, index) => `Column ${String.fromCharCode(65 + index)}`)

  const dataRows = (hasHeader ? stringMatrix.slice(1) : stringMatrix).map((row) =>
    headers.map((_, index) => String(row[index] ?? '').trim()),
  )

  return { headers, rows: dataRows }
}

export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    net: null,
    tax: null,
    gross: null,
  }

  for (const header of headers) {
    if (isLockedComputedHeader(header)) continue
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

export function mapSheetToRows(sheet: SheetData, mapping: ColumnMapping): InvoiceRow[] {
  const headerIndex = (header: string | null) => {
    if (!header || isLockedComputedHeader(header)) return -1
    return sheet.headers.indexOf(header)
  }

  const netIndex = headerIndex(mapping.net)
  const taxIndex = headerIndex(mapping.tax)
  const grossIndex = headerIndex(mapping.gross)

  return sheet.rows
    .map((row) => ({
      id: crypto.randomUUID(),
      net: netIndex >= 0 ? parseAmount(row[netIndex]) : null,
      tax: taxIndex >= 0 ? parseAmount(row[taxIndex]) : null,
      gross: grossIndex >= 0 ? parseAmount(row[grossIndex]) : null,
    }))
    .filter((row) => row.net !== null || row.tax !== null || row.gross !== null)
}

export function previewRows(sheet: SheetData, limit = 8): string[][] {
  return sheet.rows.slice(0, limit)
}

function cellValue(value: number | null | undefined): number | string {
  return value == null ? '' : value
}

/** Download current verification table as .xlsx (editable + calculated columns). */
export function exportComputedRowsToExcel(
  rows: ComputedInvoiceRow[],
  options: { locale: Locale; taxRate: number; tolerance: number },
): void {
  const headers = options.locale === 'en' ? [...EXPORT_HEADERS_EN] : [...EXPORT_HEADERS_ZH]
  const totalLabel = options.locale === 'en' ? 'Total' : '合計'

  const exportRows = rows.filter((row) => row.isTotalRow || row.status !== 'empty')

  const body = exportRows.map((row) => [
    row.isTotalRow ? totalLabel : row.index,
    cellValue(row.net),
    cellValue(row.tax),
    cellValue(row.gross),
    cellValue(row.theoreticalNet),
    cellValue(row.theoreticalTax),
    cellValue(row.theoreticalGross),
    cellValue(row.difference),
    row.isTotalRow ? '' : row.issues.join('；'),
  ])

  const meta =
    options.locale === 'en'
      ? [
          ['Tax Rate (%)', options.taxRate],
          ['Tolerance', options.tolerance],
          [],
        ]
      : [
          ['稅率 (%)', options.taxRate],
          ['容差', options.tolerance],
          [],
        ]

  const sheet = XLSX.utils.aoa_to_sheet([...meta, headers, ...body])
  sheet['!cols'] = headers.map((_, index) => ({
    wch: index === 0 ? 8 : index === headers.length - 1 ? 28 : 14,
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Invoice Verify')

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  XLSX.writeFile(workbook, `tax-rookie-invoice-verify-${stamp}.xlsx`)
}
