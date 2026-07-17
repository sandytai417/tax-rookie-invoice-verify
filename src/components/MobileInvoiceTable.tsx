'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatAmount } from '@/lib/numbers'
import type { ComputedInvoiceRow, EditableInvoiceField } from '@/types'

function parseInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '-' || trimmed === '.' || trimmed === '-.') return null
  const normalized = trimmed.replace(/,/g, '')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

function isDraftNumber(raw: string): boolean {
  return raw === '' || /^-?\d*\.?\d*$/.test(raw)
}

function statusClass(status: ComputedInvoiceRow['status']): string {
  return `mobile-row mobile-row-${status}`
}

function MobileAmountInput({
  rowId,
  field,
  value,
  label,
}: {
  rowId: string
  field: EditableInvoiceField
  value: number | null
  label: string
}) {
  const { updateRow } = useApp()
  const [draft, setDraft] = useState(value == null ? '' : String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(value == null ? '' : String(value))
  }, [value, focused])

  return (
    <input
      className="mobile-cell-input"
      type="text"
      inputMode="decimal"
      enterKeyHint="done"
      value={draft}
      aria-label={label}
      onFocus={(event) => {
        setFocused(true)
        event.currentTarget.select()
      }}
      onBlur={() => {
        setFocused(false)
        updateRow(rowId, field, parseInput(draft))
      }}
      onChange={(event) => {
        const next = event.target.value
        if (!isDraftNumber(next)) return
        setDraft(next)
        if (next === '' || Number.isFinite(Number(next))) {
          updateRow(rowId, field, parseInput(next))
        }
      }}
    />
  )
}

export function MobileInvoiceTable() {
  const { computedRows, translate, locale } = useApp()
  const numberLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US'

  function renderInput(row: ComputedInvoiceRow, field: EditableInvoiceField) {
    if (row.isTotalRow) {
      return <span className="mobile-readonly">{formatAmount(row[field], numberLocale)}</span>
    }

    return (
      <MobileAmountInput
        rowId={row.id}
        field={field}
        value={row[field]}
        label={`${translate(`grid.${field}`)} ${row.index}`}
      />
    )
  }

  function renderReadonly(value: number | null) {
    return <span className="mobile-readonly">{formatAmount(value, numberLocale)}</span>
  }

  function renderStatus(row: ComputedInvoiceRow) {
    if (row.isTotalRow || row.status === 'empty') return null
    const label =
      row.status === 'exact'
        ? translate('status.exact')
        : row.status === 'within_tolerance'
          ? translate('status.within_tolerance')
          : row.status === 'out_of_tolerance'
            ? translate('status.out_of_tolerance')
            : row.status === 'incomplete'
              ? translate('status.incomplete')
              : ''
    return <span className={`mobile-status mobile-status-${row.status}`}>{label}</span>
  }

  return (
    <div className="mobile-table-wrap">
      <table className="mobile-table">
        <thead>
          <tr>
            <th className="mobile-sticky-col">#</th>
            <th>{translate('grid.net')}</th>
            <th>{translate('grid.tax')}</th>
            <th>{translate('grid.theoreticalNet')}</th>
            <th>{translate('grid.theoreticalTax')}</th>
            <th>{translate('grid.gross')}</th>
            <th>{translate('grid.difference')}</th>
            <th>{translate('grid.status')}</th>
          </tr>
        </thead>
        <tbody>
          {computedRows.map((row) => (
            <tr key={row.id} className={statusClass(row.status)}>
              <td className="mobile-sticky-col">
                {row.isTotalRow ? translate('grid.total') : row.index}
              </td>
              <td>{renderInput(row, 'net')}</td>
              <td>{renderInput(row, 'tax')}</td>
              <td>{renderReadonly(row.theoreticalNet)}</td>
              <td>{renderReadonly(row.theoreticalTax)}</td>
              <td>{renderInput(row, 'gross')}</td>
              <td>{renderReadonly(row.difference)}</td>
              <td>{renderStatus(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
