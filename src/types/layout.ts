export interface GridCell {
  terminalId: string
  widthPercent: number
}

export interface GridRow {
  id: string
  cells: GridCell[]
  heightPercent: number
}

export interface GridLayout {
  rows: GridRow[]
}

export interface DragState {
  isDragging: boolean
  sourceTerminalId: string | null
  dropTarget: DropTarget | null
}

export interface DropTarget {
  type: 'before' | 'after' | 'new-row-above' | 'new-row-below'
  targetRowId: string
  targetTerminalId?: string
}
