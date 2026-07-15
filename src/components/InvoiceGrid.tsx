'use client'

import { useCallback, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellFocusedEvent,
  type ColDef,
  type ValueParserParams,
} from 'ag-grid-community'
import { useApp } from '@/context/AppContext'
import { formatAmount, parseAmount } from '@/lib/numbers'
import { parseClipboardMatrix } from '@/lib/verification'
import type { ComputedInvoiceRow } from '@/types'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

ModuleRegistry.registerModules([AllCommunityModule])

const editableFields = ['net', 'tax', 'gross'] as const

function statusIcon(status: ComputedInvoiceRow['status']): string {
  switch (status) {
    case 'exact':
      return '🟢'
    case 'within_tolerance':
      return '🟡'
    case 'out_of_tolerance':
      return '🔴'
    default:
      return '⚪'
  }
}

export function InvoiceGrid() {
  const { computedRows, updateRow, applyPaste, translate, locale, resolvedTheme } = useApp()

  const gridRef = useRef<AgGridReact<ComputedInvoiceRow>>(null)
  const focusRef = useRef<{ rowIndex: number; field: (typeof editableFields)[number] }>({
    rowIndex: 0,
    field: 'net',
  })

  const numberLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US'

  const amountParser = useCallback((params: ValueParserParams) => {
    if (params.newValue === '' || params.newValue === null || params.newValue === undefined) {
      return null
    }
    return parseAmount(String(params.newValue))
  }, [])

  const columnDefs = useMemo<ColDef<ComputedInvoiceRow>[]>(
    () => [
      {
        field: 'index',
        headerName: translate('grid.index'),
        width: 56,
        pinned: 'left',
        editable: false,
        suppressNavigable: true,
      },
      {
        field: 'net',
        headerName: translate('grid.net'),
        editable: true,
        width: 130,
        type: 'numericColumn',
        valueParser: amountParser,
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'tax',
        headerName: translate('grid.tax'),
        editable: true,
        width: 120,
        type: 'numericColumn',
        valueParser: amountParser,
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'gross',
        headerName: translate('grid.gross'),
        editable: true,
        width: 130,
        type: 'numericColumn',
        valueParser: amountParser,
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'theoreticalTax',
        headerName: translate('grid.theoreticalTax'),
        editable: false,
        width: 130,
        type: 'numericColumn',
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'difference',
        headerName: translate('grid.difference'),
        editable: false,
        width: 110,
        type: 'numericColumn',
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'status',
        headerName: translate('grid.status'),
        editable: false,
        minWidth: 180,
        flex: 1,
        valueFormatter: (params) =>
          `${statusIcon(params.data?.status ?? 'empty')} ${translate(`status.${params.data?.status ?? 'empty'}`)}`,
      },
    ],
    [amountParser, numberLocale, translate],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
    }),
    [],
  )

  const onCellFocused = useCallback((event: CellFocusedEvent<ComputedInvoiceRow>) => {
    if (event.rowIndex == null || !event.column) return
    const colId = typeof event.column === 'string' ? event.column : event.column.getColId()
    if (editableFields.includes(colId as (typeof editableFields)[number])) {
      focusRef.current = {
        rowIndex: event.rowIndex,
        field: colId as (typeof editableFields)[number],
      }
    }
  }, [])

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const text = event.clipboardData.getData('text/plain')
      if (!text.trim()) return
      event.preventDefault()

      const matrix = parseClipboardMatrix(text)
      if (matrix.length === 0) return

      const { rowIndex, field } = focusRef.current
      applyPaste(matrix, rowIndex, field)
    },
    [applyPaste],
  )

  return (
    <div className="grid-panel" onPaste={handlePaste}>
      <AgGridReact<ComputedInvoiceRow>
        ref={gridRef}
        theme="legacy"
        rowData={computedRows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={(params) => params.data.id}
        onCellFocused={onCellFocused}
        onCellValueChanged={(event) => {
          if (!event.data || !event.colDef.field) return
          const field = event.colDef.field
          if (!editableFields.includes(field as (typeof editableFields)[number])) return
          updateRow(
            event.data.id,
            field as (typeof editableFields)[number],
            event.newValue as number | null,
          )
        }}
        singleClickEdit
        stopEditingWhenCellsLoseFocus
        enterNavigatesVertically
        enterNavigatesVerticallyAfterEdit
        suppressRowClickSelection
        rowHeight={28}
        headerHeight={30}
        className={resolvedTheme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'}
        domLayout="normal"
      />
    </div>
  )
}
