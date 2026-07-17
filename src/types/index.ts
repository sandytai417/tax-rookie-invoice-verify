export type RowStatus =
  | 'exact'
  | 'within_tolerance'
  | 'out_of_tolerance'
  | 'incomplete'
  | 'empty'

export type TolerancePreset = '0' | '0.01' | '0.5' | '1' | 'custom'

export type ThemeMode = 'light' | 'dark' | 'system'

export type Locale = 'en' | 'zh-TW'

export interface OrderLineRow {
  id: string
  createdDate: string | null
  orderId: string | null
  itemName: string | null
  quantity: number | null
  unitPrice: number | null
  amount: number | null
  remarks: string | null
}

export interface ComputedOrderLineRow extends OrderLineRow {
  index: number
  theoreticalAmount: number | null
  difference: number | null
  status: RowStatus
}

export interface ColumnMapping {
  createdDate: string | null
  orderId: string | null
  itemName: string | null
  quantity: string | null
  unitPrice: string | null
  amount: string | null
  remarks: string | null
}

export interface SheetData {
  headers: string[]
  rows: string[][]
}

export interface ParsedWorkbook {
  sheetNames: string[]
  sheets: Record<string, SheetData>
}

export type EditableOrderField = keyof Pick<
  OrderLineRow,
  'createdDate' | 'orderId' | 'itemName' | 'quantity' | 'unitPrice' | 'amount' | 'remarks'
>

export const EDITABLE_ORDER_FIELDS: EditableOrderField[] = [
  'createdDate',
  'orderId',
  'itemName',
  'quantity',
  'unitPrice',
  'amount',
  'remarks',
]

export const NUMERIC_ORDER_FIELDS = ['quantity', 'unitPrice', 'amount'] as const
