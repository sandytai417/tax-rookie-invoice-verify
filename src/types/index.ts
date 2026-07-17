export type RowStatus =
  | 'exact'
  | 'within_tolerance'
  | 'out_of_tolerance'
  | 'incomplete'
  | 'empty'
  | 'total'

export type TolerancePreset = '0' | '0.01' | '0.5' | '1' | 'custom'

export type ThemeMode = 'light' | 'dark' | 'system'

export type Locale = 'en' | 'zh-TW'

/** Editable invoice amounts: A=net, B=tax, E=gross */
export interface InvoiceRow {
  id: string
  net: number | null
  tax: number | null
  gross: number | null
}

export interface ComputedInvoiceRow extends InvoiceRow {
  index: number
  /** C: theoretical net = B - B/(1+rate) */
  theoreticalNet: number | null
  /** D: theoretical tax = A * rate */
  theoreticalTax: number | null
  /** F: theoretical gross = C + D */
  theoreticalGross: number | null
  /** Primary difference: gross − theoreticalGross (fallback tax/net) */
  difference: number | null
  /** Human-readable mismatch details when out of tolerance */
  issues: string[]
  status: RowStatus
  isTotalRow?: boolean
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

export type EditableInvoiceField = keyof Pick<InvoiceRow, 'net' | 'tax' | 'gross'>

export const EDITABLE_INVOICE_FIELDS: EditableInvoiceField[] = ['net', 'tax', 'gross']

/** Visual column order for paste alignment (locked columns receive no user values). */
export const PASTE_COLUMN_ORDER = [
  'net',
  'theoreticalNet',
  'gross',
  'tax',
  'theoreticalTax',
  'theoreticalGross',
  'difference',
  'issues',
] as const

export type PasteColumnId = (typeof PASTE_COLUMN_ORDER)[number]

export function isEditableInvoiceField(field: string): field is EditableInvoiceField {
  return (EDITABLE_INVOICE_FIELDS as readonly string[]).includes(field)
}
