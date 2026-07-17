export interface GridCoord {
  rowIndex: number
  colId: string
}

export type SelectionMode = 'cells' | 'column' | 'row'

export interface GridSelection {
  mode: SelectionMode
  anchor: GridCoord
  focus: GridCoord
}

export function createSelection(coord: GridCoord, mode: SelectionMode = 'cells'): GridSelection {
  return { mode, anchor: coord, focus: coord }
}

export function normalizeRange(
  anchor: GridCoord,
  focus: GridCoord,
  columnIds: readonly string[],
) {
  const rowStart = Math.min(anchor.rowIndex, focus.rowIndex)
  const rowEnd = Math.max(anchor.rowIndex, focus.rowIndex)
  const anchorIdx = columnIds.indexOf(anchor.colId)
  const focusIdx = columnIds.indexOf(focus.colId)
  const colStartIdx = Math.min(anchorIdx, focusIdx)
  const colEndIdx = Math.max(anchorIdx, focusIdx)

  return {
    rowStart,
    rowEnd,
    colStartIdx,
    colEndIdx,
  }
}

export function isCellSelected(
  selection: GridSelection | null,
  rowIndex: number,
  colId: string,
  columnIds: readonly string[],
): boolean {
  if (!selection) return false

  if (selection.mode === 'column') {
    return colId === selection.anchor.colId
  }

  if (selection.mode === 'row') {
    return rowIndex === selection.anchor.rowIndex
  }

  const colIdx = columnIds.indexOf(colId)
  if (colIdx < 0) return false

  const { rowStart, rowEnd, colStartIdx, colEndIdx } = normalizeRange(
    selection.anchor,
    selection.focus,
    columnIds,
  )

  return rowIndex >= rowStart && rowIndex <= rowEnd && colIdx >= colStartIdx && colIdx <= colEndIdx
}

export function isActiveCell(
  selection: GridSelection | null,
  rowIndex: number,
  colId: string,
): boolean {
  if (!selection) return false
  return selection.focus.rowIndex === rowIndex && selection.focus.colId === colId
}

export function selectionTopLeft(
  selection: GridSelection | null,
  columnIds: readonly string[],
): GridCoord | null {
  if (!selection) return null

  if (selection.mode === 'column') {
    return { rowIndex: 0, colId: selection.anchor.colId }
  }

  if (selection.mode === 'row') {
    const firstDataCol = columnIds.find((colId) => colId !== 'index') ?? columnIds[0]
    return { rowIndex: selection.anchor.rowIndex, colId: firstDataCol }
  }

  const { rowStart, colStartIdx } = normalizeRange(selection.anchor, selection.focus, columnIds)
  return { rowIndex: rowStart, colId: columnIds[colStartIdx] }
}
