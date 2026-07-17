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
import { getRowSpan, parseClipboardMatrix } from '@/lib/verification'
import type { ComputedOrderLineRow, EditableOrderField } from '@/types'
import { EDITABLE_ORDER_FIELDS } from '@/types'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

ModuleRegistry.registerModules([AllCommunityModule])

function statusIcon(status: ComputedOrderLineRow['status']): string {
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

  const gridRef = useRef<AgGridReact<ComputedOrderLineRow>>(null)
  const focusRef = useRef<{ rowIndex: number; field: EditableOrderField }>({
    rowIndex: 0,
    field: 'createdDate',
  })

  const numberLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US'

  const amountParser = useCallback((params: ValueParserParams) => {
    if (params.newValue === '' || params.newValue === null || params.newValue === undefined) {
      return null
    }
    return parseAmount(String(params.newValue))
  }, [])

  const textParser = useCallback((params: ValueParserParams) => {
    if (params.newValue === '' || params.newValue === null || params.newValue === undefined) {
      return null
    }
    return String(params.newValue).trim() || null
  }, [])

  const columnDefs = useMemo<ColDef<ComputedOrderLineRow>[]>(
    () => [
      {
        field: 'index',
        headerName: translate('grid.index'),
        width: 48,
        pinned: 'left',
        editable: false,
        suppressNavigable: true,
      },
      {
        field: 'createdDate',
        headerName: translate('grid.createdDate'),
        editable: true,
        width: 110,
        valueParser: textParser,
        rowSpan: (params) =>
          params.node?.rowIndex == null
            ? 1
            : getRowSpan(computedRows, params.node.rowIndex, 'createdDate'),
        cellClassRules: {
          'cell-merged': (params) =>
            params.node?.rowIndex != null &&
            getRowSpan(computedRows, params.node.rowIndex, 'createdDate') > 1,
        },
      },
      {
        field: 'orderId',
        headerName: translate('grid.orderId'),
        editable: true,
        width: 120,
        valueParser: textParser,
        rowSpan: (params) =>
          params.node?.rowIndex == null
            ? 1
            : getRowSpan(computedRows, params.node.rowIndex, 'orderId'),
        cellClassRules: {
          'cell-merged': (params) =>
            params.node?.rowIndex != null &&
            getRowSpan(computedRows, params.node.rowIndex, 'orderId') > 1,
        },
      },
      {
        field: 'itemName',
        headerName: translate('grid.itemName'),
        editable: true,
        width: 180,
        valueParser: textParser,
      },
      {
        field: 'quantity',
        headerName: translate('grid.quantity'),
        editable: true,
        width: 90,
        type: 'numericColumn',
        valueParser: amountParser,
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'unitPrice',
        headerName: translate('grid.unitPrice'),
        editable: true,
        width: 100,
        type: 'numericColumn',
        valueParser: amountParser,
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'amount',
        headerName: translate('grid.amount'),
        editable: true,
        width: 110,
        type: 'numericColumn',
        valueParser: amountParser,
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'theoreticalAmount',
        headerName: translate('grid.theoreticalAmount'),
        editable: false,
        width: 110,
        type: 'numericColumn',
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'difference',
        headerName: translate('grid.difference'),
        editable: false,
        width: 90,
        type: 'numericColumn',
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'remarks',
        headerName: translate('grid.remarks'),
        editable: true,
        width: 120,
        valueParser: textParser,
      },
      {
        field: 'status',
        headerName: translate('grid.status'),
        editable: false,
        minWidth: 160,
        flex: 1,
        valueFormatter: (params) =>
          `${statusIcon(params.data?.status ?? 'empty')} ${translate(`status.${params.data?.status ?? 'empty'}`)}`,
      },
    ],
    [amountParser, computedRows, numberLocale, textParser, translate],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      wrapText: false,
      autoHeight: false,
    }),
    [],
  )

  const onCellFocused = useCallback((event: CellFocusedEvent<ComputedOrderLineRow>) => {
    if (event.rowIndex == null || !event.column) return
    const colId = typeof event.column === 'string' ? event.column : event.column.getColId()
    if (EDITABLE_ORDER_FIELDS.includes(colId as EditableOrderField)) {
      focusRef.current = {
        rowIndex: event.rowIndex,
        field: colId as EditableOrderField,
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
      <AgGridReact<ComputedOrderLineRow>
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
          if (!EDITABLE_ORDER_FIELDS.includes(field as EditableOrderField)) return
          updateRow(event.data.id, field as EditableOrderField, event.newValue)
        }}
        singleClickEdit
        stopEditingWhenCellsLoseFocus
        enterNavigatesVertically
        enterNavigatesVerticallyAfterEdit
        suppressRowClickSelection
        enableCellSpan
        rowHeight={28}
        headerHeight={30}
        className={resolvedTheme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'}
        domLayout="normal"
      />
    </div>
  )
}
