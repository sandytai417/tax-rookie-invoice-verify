import * as XLSX from 'xlsx'
import { parseAmount } from './numbers'
import type { ColumnMapping, ParsedWorkbook, SheetData } from '@/types'

function sheetToData(sheet: XLSX.WorkSheet): SheetData {
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  })

  if (matrix.length === 0) {
    return { headers: [], rows: [] }
  }

  const headerRow = matrix[0].map((cell) => String(cell ?? '').trim())
  const hasHeader = headerRow.some(Boolean)
  const headers = hasHeader
    ? headerRow.map((header, index) => header || `Column ${String.fromCharCode(65 + index)}`)
    : headerRow.map((_, index) => `Column ${String.fromCharCode(65 + index)}`)

  const dataRows = (hasHeader ? matrix.slice(1) : matrix).map((row) =>
    headers.map((_, index) => String(row[index] ?? '').trim()),
  )

  return { headers, rows: dataRows }
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

export function mapSheetToRows(
  sheet: SheetData,
  mapping: ColumnMapping,
): Array<{ net: number | null; tax: number | null; gross: number | null }> {
  const headerIndex = (header: string | null) =>
    header ? sheet.headers.indexOf(header) : -1

  const netIndex = headerIndex(mapping.net)
  const taxIndex = headerIndex(mapping.tax)
  const grossIndex = headerIndex(mapping.gross)

  return sheet.rows
    .map((row) => ({
      net: netIndex >= 0 ? parseAmount(row[netIndex]) : null,
      tax: taxIndex >= 0 ? parseAmount(row[taxIndex]) : null,
      gross: grossIndex >= 0 ? parseAmount(row[grossIndex]) : null,
    }))
    .filter((row) => row.net !== null || row.tax !== null || row.gross !== null)
}

export function previewRows(sheet: SheetData, limit = 8): string[][] {
  return sheet.rows.slice(0, limit)
}
