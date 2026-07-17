import { parseAmount } from './numbers'
import type { EditableInvoiceField, InvoiceRow, PasteColumnId } from '@/types'
import { PASTE_COLUMN_ORDER, isEditableInvoiceField } from '@/types'

export type PasteRowUpdates = Partial<Pick<InvoiceRow, EditableInvoiceField>>

/**
 * Map one clipboard row onto grid columns starting at `startColumn`.
 * Multi-column pastes always align to the on-screen column order.
 * Locked columns (theoretical / difference / issues) never receive values.
 */
export function mapClipboardRowToUpdates(
  clipboardRow: string[],
  startColumn: string,
): PasteRowUpdates {
  if (clipboardRow.length === 0) return {}

  const pasteStart = PASTE_COLUMN_ORDER.indexOf(startColumn as PasteColumnId)
  const remainingColumns =
    pasteStart >= 0 ? PASTE_COLUMN_ORDER.slice(pasteStart) : [...PASTE_COLUMN_ORDER]

  // Single value: only apply when the start cell itself is editable.
  if (clipboardRow.length === 1) {
    if (!isEditableInvoiceField(startColumn)) return {}
    return { [startColumn]: parseAmount(clipboardRow[0] ?? '') }
  }

  const updates: PasteRowUpdates = {}
  remainingColumns.forEach((columnId, columnIndex) => {
    if (columnIndex >= clipboardRow.length) return
    // Locked theoretical (and other calculated) columns stay read-only.
    if (!isEditableInvoiceField(columnId)) return
    updates[columnId] = parseAmount(clipboardRow[columnIndex] ?? '')
  })
  return updates
}
