export type RowStatus =
  | 'exact'
  | 'within_tolerance'
  | 'out_of_tolerance'
  | 'incomplete'
  | 'empty'

export type TolerancePreset = '0' | '0.01' | '0.5' | '1' | 'custom'

export type ThemeMode = 'light' | 'dark' | 'system'

export type Locale = 'en' | 'zh-TW'

export interface InvoiceRow {
  id: string
  net: number | null
  tax: number | null
  gross: number | null
}

export interface ComputedInvoiceRow extends InvoiceRow {
  index: number
  theoreticalTax: number | null
  difference: number | null
  status: RowStatus
}

export interface ColumnMapping {
  net: string | null
  tax: string | null
  gross: string | null
}

export interface SheetData {
  headers: string[]
  rows: string[][]
}

export interface ParsedWorkbook {
  sheetNames: string[]
  sheets: Record<string, SheetData>
}
