'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClickedEvent,
  type CellFocusedEvent,
  type CellKeyDownEvent,
  type CellMouseDownEvent,
  type CellMouseOverEvent,
  type ColDef,
  type ColumnHeaderClickedEvent,
  type HeaderClassParams,
  type ValueParserParams,
} from 'ag-grid-community'
import { useApp } from '@/context/AppContext'
import {
  createSelection,
  isActiveCell,
  isCellSelected,
  selectionTopLeft,
  type GridCoord,
  type GridSelection,
} from '@/lib/gridSelection'
import { formatAmount, parseAmount } from '@/lib/numbers'
import { getRowSpan, parseClipboardMatrix } from '@/lib/verification'
import type { ComputedOrderLineRow, EditableOrderField } from '@/types'
import { EDITABLE_ORDER_FIELDS } from '@/types'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

ModuleRegistry.registerModules([AllCommunityModule])

const GRID_COLUMN_IDS = [
  'index',
  'createdDate',
  'orderId',
  'itemName',
  'quantity',
  'unitPrice',
  'amount',
  'theoreticalAmount',
  'difference',
  'remarks',
  'status',
] as const

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

function coordFromEvent(
  rowIndex: number | null | undefined,
  colId: string | undefined,
): GridCoord | null {
  if (rowIndex == null || !colId) return null
  return { rowIndex, colId }
}

export function InvoiceGrid() {
  const { computedRows, updateRow, applyPaste, translate, locale, resolvedTheme } = useApp()

  const gridRef = useRef<AgGridReact<ComputedOrderLineRow>>(null)
  const [selection, setSelection] = useState<GridSelection | null>(
    createSelection({ rowIndex: 0, colId: 'createdDate' }),
  )
  const dragSelectingRef = useRef(false)
  const extendSelectionRef = useRef(false)
  const pasteAnchorRef = useRef<{ rowIndex: number; field: EditableOrderField }>({
    rowIndex: 0,
    field: 'createdDate',
  })

  const numberLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US'
  const themeClass = resolvedTheme === 'dark' ? 'ag-theme-excel-dark' : 'ag-theme-excel'

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

  const syncPasteAnchor = useCallback((coord: GridCoord) => {
    if (!EDITABLE_ORDER_FIELDS.includes(coord.colId as EditableOrderField)) return
    pasteAnchorRef.current = {
      rowIndex: coord.rowIndex,
      field: coord.colId as EditableOrderField,
    }
  }, [])

  const updateSelection = useCallback(
    (next: GridSelection | null) => {
      setSelection(next)
      const topLeft = selectionTopLeft(next, GRID_COLUMN_IDS)
      if (topLeft && EDITABLE_ORDER_FIELDS.includes(topLeft.colId as EditableOrderField)) {
        syncPasteAnchor(topLeft)
      }
    },
    [syncPasteAnchor],
  )

  const selectionClassRules = useMemo(
    () => ({
      'cell-selected': (params: { node?: { rowIndex?: number | null }; colDef?: { field?: string } }) =>
        params.node?.rowIndex != null &&
        params.colDef?.field != null &&
        isCellSelected(selection, params.node.rowIndex, params.colDef.field, GRID_COLUMN_IDS),
      'cell-active': (params: { node?: { rowIndex?: number | null }; colDef?: { field?: string } }) =>
        params.node?.rowIndex != null &&
        params.colDef?.field != null &&
        isActiveCell(selection, params.node.rowIndex, params.colDef.field),
      'row-selected': (params: { node?: { rowIndex?: number | null } }) =>
        selection?.mode === 'row' &&
        params.node?.rowIndex != null &&
        params.node.rowIndex === selection.anchor.rowIndex,
    }),
    [selection],
  )

  const columnDefs = useMemo<ColDef<ComputedOrderLineRow>[]>(
    () => [
      {
        field: 'index',
        headerName: translate('grid.index'),
        width: 48,
        pinned: 'left',
        editable: false,
        suppressNavigable: true,
        headerClass: 'excel-row-header',
        cellClass: 'excel-row-header-cell',
        cellClassRules: selectionClassRules,
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
          ...selectionClassRules,
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
          ...selectionClassRules,
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
        cellClassRules: selectionClassRules,
      },
      {
        field: 'quantity',
        headerName: translate('grid.quantity'),
        editable: true,
        width: 90,
        type: 'numericColumn',
        valueParser: amountParser,
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header',
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'unitPrice',
        headerName: translate('grid.unitPrice'),
        editable: true,
        width: 100,
        type: 'numericColumn',
        valueParser: amountParser,
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header',
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'amount',
        headerName: translate('grid.amount'),
        editable: true,
        width: 110,
        type: 'numericColumn',
        valueParser: amountParser,
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header',
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'theoreticalAmount',
        headerName: translate('grid.theoreticalAmount'),
        editable: false,
        width: 110,
        type: 'numericColumn',
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header',
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'difference',
        headerName: translate('grid.difference'),
        editable: false,
        width: 90,
        type: 'numericColumn',
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header',
        valueFormatter: (params) => formatAmount(params.value ?? null, numberLocale),
      },
      {
        field: 'remarks',
        headerName: translate('grid.remarks'),
        editable: true,
        width: 120,
        valueParser: textParser,
        cellClassRules: selectionClassRules,
      },
      {
        field: 'status',
        headerName: translate('grid.status'),
        editable: false,
        minWidth: 160,
        flex: 1,
        cellClassRules: selectionClassRules,
        valueFormatter: (params) =>
          `${statusIcon(params.data?.status ?? 'empty')} ${translate(`status.${params.data?.status ?? 'empty'}`)}`,
      },
    ],
    [amountParser, computedRows, numberLocale, selectionClassRules, textParser, translate],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      wrapText: false,
      autoHeight: false,
      headerClass: 'excel-col-header',
      headerClassRules: {
        'col-selected': (params: HeaderClassParams<ComputedOrderLineRow>) =>
          selection?.mode === 'column' &&
          params.column?.getColId() === selection.anchor.colId,
      },
    }),
    [selection],
  )

  const onCellFocused = useCallback(
    (event: CellFocusedEvent<ComputedOrderLineRow>) => {
      if (dragSelectingRef.current) return

      const coord = coordFromEvent(
        event.rowIndex,
        typeof event.column === 'string' ? event.column : event.column?.getColId(),
      )
      if (!coord) return

      if (extendSelectionRef.current && selection) {
        updateSelection({ ...selection, mode: 'cells', focus: coord })
        extendSelectionRef.current = false
        return
      }

      updateSelection(createSelection(coord))
    },
    [selection, updateSelection],
  )

  const onCellMouseDown = useCallback(
    (event: CellMouseDownEvent<ComputedOrderLineRow>) => {
      if (event.event instanceof MouseEvent && event.event.button !== 0) return
      const coord = coordFromEvent(event.rowIndex, event.colDef.field)
      if (!coord) return

      if (event.colDef.field === 'index') {
        updateSelection(createSelection(coord, 'row'))
        return
      }

      dragSelectingRef.current = true

      if (event.event instanceof MouseEvent && event.event.shiftKey && selection) {
        updateSelection({ mode: 'cells', anchor: selection.anchor, focus: coord })
        return
      }

      updateSelection(createSelection(coord))
    },
    [selection, updateSelection],
  )

  const onCellMouseOver = useCallback(
    (event: CellMouseOverEvent<ComputedOrderLineRow>) => {
      if (!dragSelectingRef.current) return
      const coord = coordFromEvent(event.rowIndex, event.colDef.field)
      if (!coord || coord.colId === 'index') return
      updateSelection({
        mode: 'cells',
        anchor: selection?.anchor ?? coord,
        focus: coord,
      })
    },
    [selection, updateSelection],
  )

  const stopDragSelection = useCallback(() => {
    dragSelectingRef.current = false
  }, [])

  const onColumnHeaderClicked = useCallback(
    (event: ColumnHeaderClickedEvent<ComputedOrderLineRow>) => {
      if (!('getColId' in event.column)) return
      const colId = event.column.getColId()
      if (colId === 'index') return
      updateSelection(createSelection({ rowIndex: 0, colId }, 'column'))
    },
    [updateSelection],
  )

  const onCellClicked = useCallback(
    (event: CellClickedEvent<ComputedOrderLineRow>) => {
      if (event.colDef.field !== 'index') return
      const coord = coordFromEvent(event.rowIndex, event.colDef.field)
      if (!coord) return
      updateSelection(createSelection(coord, 'row'))
    },
    [updateSelection],
  )

  const onCellKeyDown = useCallback((event: CellKeyDownEvent<ComputedOrderLineRow>) => {
    const keyboardEvent = event.event
    if (!(keyboardEvent instanceof KeyboardEvent)) return

    const coord = coordFromEvent(event.rowIndex, event.colDef.field)
    if (!coord) return

    if (
      keyboardEvent.shiftKey &&
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(keyboardEvent.key)
    ) {
      extendSelectionRef.current = true
      return
    }

    if (keyboardEvent.ctrlKey && keyboardEvent.code === 'Space') {
      keyboardEvent.preventDefault()
      if (coord.colId === 'index') return
      updateSelection(createSelection(coord, 'column'))
      return
    }

    if (keyboardEvent.shiftKey && keyboardEvent.code === 'Space') {
      keyboardEvent.preventDefault()
      updateSelection(createSelection({ rowIndex: coord.rowIndex, colId: 'index' }, 'row'))
    }
  }, [updateSelection])

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const text = event.clipboardData.getData('text/plain')
      if (!text.trim()) return
      event.preventDefault()

      const matrix = parseClipboardMatrix(text)
      if (matrix.length === 0) return

      const { rowIndex, field } = pasteAnchorRef.current
      applyPaste(matrix, rowIndex, field)
    },
    [applyPaste],
  )

  return (
    <div
      className="grid-panel excel-grid-shell"
      onPaste={handlePaste}
      onMouseUp={stopDragSelection}
      onMouseLeave={stopDragSelection}
    >
      <AgGridReact<ComputedOrderLineRow>
        ref={gridRef}
        theme="legacy"
        rowData={computedRows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={(params) => params.data.id}
        onCellFocused={onCellFocused}
        onCellMouseDown={onCellMouseDown}
        onCellMouseOver={onCellMouseOver}
        onCellClicked={onCellClicked}
        onColumnHeaderClicked={onColumnHeaderClicked}
        onCellKeyDown={onCellKeyDown}
        onCellValueChanged={(event) => {
          if (!event.data || !event.colDef.field) return
          const field = event.colDef.field
          if (!EDITABLE_ORDER_FIELDS.includes(field as EditableOrderField)) return
          const value =
            event.newValue === '' || event.newValue === undefined ? null : event.newValue
          updateRow(event.data.id, field as EditableOrderField, value)
        }}
        stopEditingWhenCellsLoseFocus
        enterNavigatesVertically
        enterNavigatesVerticallyAfterEdit
        suppressRowClickSelection
        enableCellSpan
        rowHeight={22}
        headerHeight={24}
        className={themeClass}
        domLayout="normal"
      />
    </div>
  )
}
