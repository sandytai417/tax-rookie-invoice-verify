'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClickedEvent,
  type CellClassParams,
  type CellFocusedEvent,
  type CellKeyDownEvent,
  type CellMouseDownEvent,
  type CellMouseOverEvent,
  type ColDef,
  type ColumnHeaderClickedEvent,
  type HeaderClassParams,
  type RowClassParams,
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
import { parseClipboardMatrix } from '@/lib/verification'
import type { ComputedInvoiceRow, EditableInvoiceField } from '@/types'
import { EDITABLE_INVOICE_FIELDS } from '@/types'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

ModuleRegistry.registerModules([AllCommunityModule])

const GRID_COLUMN_IDS = [
  'index',
  'net',
  'tax',
  'theoreticalNet',
  'theoreticalTax',
  'gross',
  'difference',
  'status',
] as const

function statusLabel(
  status: ComputedInvoiceRow['status'],
  translate: (key: string) => string,
): string {
  switch (status) {
    case 'exact':
      return `● ${translate('status.exact')}`
    case 'within_tolerance':
      return `● ${translate('status.within_tolerance')}`
    case 'out_of_tolerance':
      return `● ${translate('status.out_of_tolerance')}`
    case 'incomplete':
      return `○ ${translate('status.incomplete')}`
    case 'total':
      return ''
    default:
      return ''
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

  const gridRef = useRef<AgGridReact<ComputedInvoiceRow>>(null)
  const [selection, setSelection] = useState<GridSelection | null>(
    createSelection({ rowIndex: 1, colId: 'net' }),
  )
  const dragSelectingRef = useRef(false)
  const extendSelectionRef = useRef(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const pasteAnchorRef = useRef<{ rowIndex: number; field: EditableInvoiceField }>({
    rowIndex: 1,
    field: 'net',
  })

  const numberLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US'
  const themeClass = resolvedTheme === 'dark' ? 'ag-theme-excel-dark' : 'ag-theme-excel'

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)')
    const update = () => setIsTouchDevice(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const amountParser = useCallback((params: ValueParserParams) => {
    if (params.newValue === '' || params.newValue === null || params.newValue === undefined) {
      return null
    }
    return parseAmount(String(params.newValue))
  }, [])

  const syncPasteAnchor = useCallback((coord: GridCoord) => {
    if (!EDITABLE_INVOICE_FIELDS.includes(coord.colId as EditableInvoiceField)) return
    pasteAnchorRef.current = {
      rowIndex: coord.rowIndex,
      field: coord.colId as EditableInvoiceField,
    }
  }, [])

  const updateSelection = useCallback(
    (next: GridSelection | null) => {
      setSelection(next)
      const topLeft = selectionTopLeft(next, GRID_COLUMN_IDS)
      if (topLeft && EDITABLE_INVOICE_FIELDS.includes(topLeft.colId as EditableInvoiceField)) {
        syncPasteAnchor(topLeft)
      }
    },
    [syncPasteAnchor],
  )

  const selectionClassRules = useMemo(
    () => ({
      'cell-selected': (params: CellClassParams<ComputedInvoiceRow>) =>
        params.node?.rowIndex != null &&
        params.colDef?.field != null &&
        isCellSelected(selection, params.node.rowIndex, params.colDef.field, GRID_COLUMN_IDS),
      'cell-active': (params: CellClassParams<ComputedInvoiceRow>) =>
        params.node?.rowIndex != null &&
        params.colDef?.field != null &&
        isActiveCell(selection, params.node.rowIndex, params.colDef.field),
      'row-selected': (params: CellClassParams<ComputedInvoiceRow>) =>
        selection?.mode === 'row' &&
        params.node?.rowIndex != null &&
        params.node.rowIndex === selection.anchor.rowIndex,
    }),
    [selection],
  )

  const amountFormatter = useCallback(
    (value: number | null | undefined) => formatAmount(value ?? null, numberLocale),
    [numberLocale],
  )

  const columnDefs = useMemo<ColDef<ComputedInvoiceRow>[]>(
    () => [
      {
        field: 'index',
        headerName: '#',
        width: 48,
        pinned: 'left',
        editable: false,
        suppressNavigable: true,
        headerClass: 'excel-row-header',
        cellClass: 'excel-row-header-cell',
        cellClassRules: selectionClassRules,
        valueFormatter: (params) =>
          params.data?.isTotalRow ? translate('grid.total') : String(params.value ?? ''),
      },
      {
        field: 'net',
        headerName: translate('grid.net'),
        editable: (params) => !params.data?.isTotalRow,
        width: 120,
        type: 'numericColumn',
        valueParser: amountParser,
        cellEditorPopup: isTouchDevice,
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header excel-editable-header',
        valueFormatter: (params) => amountFormatter(params.value),
      },
      {
        field: 'tax',
        headerName: translate('grid.tax'),
        editable: (params) => !params.data?.isTotalRow,
        width: 110,
        type: 'numericColumn',
        valueParser: amountParser,
        cellEditorPopup: isTouchDevice,
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header excel-editable-header',
        valueFormatter: (params) => amountFormatter(params.value),
      },
      {
        field: 'theoreticalNet',
        headerName: translate('grid.theoreticalNet'),
        editable: false,
        width: 130,
        type: 'numericColumn',
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header excel-calc-header',
        valueFormatter: (params) => amountFormatter(params.value),
      },
      {
        field: 'theoreticalTax',
        headerName: translate('grid.theoreticalTax'),
        editable: false,
        width: 120,
        type: 'numericColumn',
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header excel-calc-header',
        valueFormatter: (params) => amountFormatter(params.value),
      },
      {
        field: 'gross',
        headerName: translate('grid.gross'),
        editable: (params) => !params.data?.isTotalRow,
        width: 120,
        type: 'numericColumn',
        valueParser: amountParser,
        cellEditorPopup: isTouchDevice,
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header excel-editable-header',
        valueFormatter: (params) => amountFormatter(params.value),
      },
      {
        field: 'difference',
        headerName: translate('grid.difference'),
        editable: false,
        width: 110,
        type: 'numericColumn',
        cellClassRules: selectionClassRules,
        cellStyle: { textAlign: 'right' },
        headerClass: 'excel-col-header excel-num-header excel-calc-header',
        valueFormatter: (params) => amountFormatter(params.value),
      },
      {
        field: 'status',
        headerName: translate('grid.status'),
        editable: false,
        flex: 1,
        minWidth: 140,
        cellClassRules: {
          ...selectionClassRules,
          'status-exact': (params) => params.data?.status === 'exact',
          'status-within': (params) => params.data?.status === 'within_tolerance',
          'status-out': (params) => params.data?.status === 'out_of_tolerance',
        },
        headerClass: 'excel-col-header excel-calc-header',
        valueFormatter: (params) =>
          params.data ? statusLabel(params.data.status, translate) : '',
      },
    ],
    [amountFormatter, amountParser, isTouchDevice, selectionClassRules, translate],
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
        'col-selected': (params: HeaderClassParams<ComputedInvoiceRow>) =>
          selection?.mode === 'column' && params.column?.getColId() === selection.anchor.colId,
      },
    }),
    [selection],
  )

  const getRowClass = useCallback((params: RowClassParams<ComputedInvoiceRow>) => {
    const status = params.data?.status
    if (!status) return undefined
    return `row-status-${status}`
  }, [])

  const onCellFocused = useCallback(
    (event: CellFocusedEvent<ComputedInvoiceRow>) => {
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
    (event: CellMouseDownEvent<ComputedInvoiceRow>) => {
      const nativeEvent = event.event
      if (nativeEvent instanceof MouseEvent && nativeEvent.button !== 0) return

      const coord = coordFromEvent(event.rowIndex, event.colDef.field)
      if (!coord) return

      if (event.colDef.field === 'index') {
        updateSelection(createSelection(coord, 'row'))
        return
      }

      // On touch, avoid drag-select so single tap can open the cell editor.
      const isTouch =
        isTouchDevice ||
        (nativeEvent instanceof PointerEvent && nativeEvent.pointerType === 'touch') ||
        (typeof TouchEvent !== 'undefined' && nativeEvent instanceof TouchEvent)

      if (!isTouch) {
        dragSelectingRef.current = true
      }

      if (nativeEvent instanceof MouseEvent && nativeEvent.shiftKey && selection) {
        updateSelection({ mode: 'cells', anchor: selection.anchor, focus: coord })
        return
      }

      updateSelection(createSelection(coord))
    },
    [isTouchDevice, selection, updateSelection],
  )

  const onCellMouseOver = useCallback(
    (event: CellMouseOverEvent<ComputedInvoiceRow>) => {
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
    (event: ColumnHeaderClickedEvent<ComputedInvoiceRow>) => {
      if (!('getColId' in event.column)) return
      const colId = event.column.getColId()
      if (colId === 'index') return
      updateSelection(createSelection({ rowIndex: 0, colId }, 'column'))
    },
    [updateSelection],
  )

  const onCellClicked = useCallback(
    (event: CellClickedEvent<ComputedInvoiceRow>) => {
      if (event.colDef.field !== 'index') return
      const coord = coordFromEvent(event.rowIndex, event.colDef.field)
      if (!coord) return
      updateSelection(createSelection(coord, 'row'))
    },
    [updateSelection],
  )

  const onCellKeyDown = useCallback(
    (event: CellKeyDownEvent<ComputedInvoiceRow>) => {
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
    },
    [updateSelection],
  )

  const onCellEditingStarted = useCallback(() => {
    // Defer so AG Grid has mounted the editor input (critical on iOS).
    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        '.ag-cell-inline-editing input, .ag-cell-editor input, .ag-popup-editor input',
      )
      if (!input) return
      input.setAttribute('inputmode', 'decimal')
      input.setAttribute('enterkeyhint', 'done')
      input.style.fontSize = '16px'
      input.focus({ preventScroll: true })
      input.select()
    }, 0)
  }, [])

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
      onTouchEnd={stopDragSelection}
      onTouchCancel={stopDragSelection}
    >
      <AgGridReact<ComputedInvoiceRow>
        ref={gridRef}
        theme="legacy"
        rowData={computedRows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={(params) => params.data.id}
        getRowClass={getRowClass}
        onCellFocused={onCellFocused}
        onCellMouseDown={onCellMouseDown}
        onCellMouseOver={onCellMouseOver}
        onCellClicked={onCellClicked}
        onColumnHeaderClicked={onColumnHeaderClicked}
        onCellKeyDown={onCellKeyDown}
        onCellEditingStarted={onCellEditingStarted}
        onCellValueChanged={(event) => {
          if (!event.data || event.data.isTotalRow || !event.colDef.field) return
          const field = event.colDef.field
          if (!EDITABLE_INVOICE_FIELDS.includes(field as EditableInvoiceField)) return
          const value =
            event.newValue === '' || event.newValue === undefined ? null : (event.newValue as number | null)
          updateRow(event.data.id, field as EditableInvoiceField, value)
        }}
        stopEditingWhenCellsLoseFocus={!isTouchDevice}
        singleClickEdit
        enterNavigatesVertically
        enterNavigatesVerticallyAfterEdit
        suppressRowClickSelection
        alwaysShowHorizontalScroll
        suppressMovableColumns
        rowHeight={isTouchDevice ? 40 : 28}
        headerHeight={isTouchDevice ? 36 : 32}
        className={themeClass}
        domLayout="normal"
      />
    </div>
  )
}
