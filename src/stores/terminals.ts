import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GridLayout, GridRow, DragState, DropTarget } from '@/types/layout'

export interface TerminalSession {
  id: string
  cwd: string
  title: string
  createdAt: string
}

function generateRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useTerminalsStore = defineStore('terminals', () => {
  const terminals = ref<TerminalSession[]>([])
  const activeTerminalId = ref<string | null>(null)
  const isAddDialogOpen = ref(false)

  // Grid layout state
  const gridLayout = ref<GridLayout | null>(null)
  const dragState = ref<DragState>({
    isDragging: false,
    sourceTerminalId: null,
    dropTarget: null
  })

  const activeTerminal = computed(() =>
    terminals.value.find(t => t.id === activeTerminalId.value) || null
  )

  const activeIndex = computed(() => {
    if (!activeTerminalId.value) return -1
    return terminals.value.findIndex(t => t.id === activeTerminalId.value)
  })

  // Initialize grid layout from terminals (auto-arrange in single row)
  function initializeLayout() {
    if (terminals.value.length === 0) {
      gridLayout.value = null
      return
    }

    const widthPercent = 100 / terminals.value.length
    gridLayout.value = {
      rows: [{
        id: generateRowId(),
        heightPercent: 100,
        cells: terminals.value.map(t => ({
          terminalId: t.id,
          widthPercent
        }))
      }]
    }
  }

  // Add terminal to layout
  function addTerminalToLayout(terminalId: string) {
    if (!gridLayout.value) {
      gridLayout.value = {
        rows: [{
          id: generateRowId(),
          heightPercent: 100,
          cells: [{ terminalId, widthPercent: 100 }]
        }]
      }
      return
    }

    // Add to first row and redistribute widths
    const firstRow = gridLayout.value.rows[0]
    firstRow.cells.push({ terminalId, widthPercent: 0 })

    // Redistribute widths equally
    const newWidth = 100 / firstRow.cells.length
    firstRow.cells.forEach(cell => cell.widthPercent = newWidth)
  }

  // Remove terminal from layout
  function removeTerminalFromLayout(terminalId: string) {
    if (!gridLayout.value) return

    for (const row of gridLayout.value.rows) {
      const cellIndex = row.cells.findIndex(c => c.terminalId === terminalId)
      if (cellIndex !== -1) {
        row.cells.splice(cellIndex, 1)

        // Redistribute widths in row
        if (row.cells.length > 0) {
          const newWidth = 100 / row.cells.length
          row.cells.forEach(cell => cell.widthPercent = newWidth)
        }
        break
      }
    }

    // Remove empty rows
    gridLayout.value.rows = gridLayout.value.rows.filter(r => r.cells.length > 0)

    // Redistribute row heights
    if (gridLayout.value.rows.length > 0) {
      const newHeight = 100 / gridLayout.value.rows.length
      gridLayout.value.rows.forEach(row => row.heightPercent = newHeight)
    } else {
      gridLayout.value = null
    }
  }

  // Find terminal position in layout
  function findTerminalPosition(terminalId: string): { row: GridRow; cellIndex: number } | null {
    if (!gridLayout.value) return null

    for (const row of gridLayout.value.rows) {
      const cellIndex = row.cells.findIndex(c => c.terminalId === terminalId)
      if (cellIndex !== -1) {
        return { row, cellIndex }
      }
    }
    return null
  }

  // Move terminal to new position (drag-and-drop)
  function moveTerminal(terminalId: string, target: DropTarget) {
    if (!gridLayout.value) return

    const position = findTerminalPosition(terminalId)
    if (!position) return

    // Remove from current position
    position.row.cells.splice(position.cellIndex, 1)

    // Handle based on drop target type
    if (target.type === 'new-row-below' || target.type === 'new-row-above') {
      // Create new row
      const newRow: GridRow = {
        id: generateRowId(),
        heightPercent: 0,
        cells: [{ terminalId, widthPercent: 100 }]
      }

      const targetRowIndex = gridLayout.value.rows.findIndex(r => r.id === target.targetRowId)
      if (targetRowIndex !== -1) {
        if (target.type === 'new-row-below') {
          gridLayout.value.rows.splice(targetRowIndex + 1, 0, newRow)
        } else {
          gridLayout.value.rows.splice(targetRowIndex, 0, newRow)
        }
      }
    } else {
      // Insert into existing row
      const targetRow = gridLayout.value.rows.find(r => r.id === target.targetRowId)
      if (targetRow && target.targetTerminalId) {
        const targetCellIndex = targetRow.cells.findIndex(c => c.terminalId === target.targetTerminalId)
        if (targetCellIndex !== -1) {
          const insertIndex = target.type === 'before' ? targetCellIndex : targetCellIndex + 1
          targetRow.cells.splice(insertIndex, 0, { terminalId, widthPercent: 0 })
        }
      }
    }

    // Clean up empty rows
    gridLayout.value.rows = gridLayout.value.rows.filter(r => r.cells.length > 0)

    // Normalize layout
    normalizeLayout()
  }

  // Normalize layout (ensure percentages sum to 100)
  function normalizeLayout() {
    if (!gridLayout.value || gridLayout.value.rows.length === 0) return

    // Check if any row has 0 height (newly added) - if so, distribute equally
    const hasZeroHeightRow = gridLayout.value.rows.some(r => r.heightPercent === 0)
    if (hasZeroHeightRow) {
      const equalHeight = 100 / gridLayout.value.rows.length
      gridLayout.value.rows.forEach(r => r.heightPercent = equalHeight)
    } else {
      // Normalize row heights proportionally
      const totalHeight = gridLayout.value.rows.reduce((sum, r) => sum + r.heightPercent, 0)
      if (totalHeight > 0 && totalHeight !== 100) {
        gridLayout.value.rows.forEach(r => r.heightPercent = (r.heightPercent / totalHeight) * 100)
      }
    }

    // Normalize cell widths in each row
    gridLayout.value.rows.forEach(row => {
      // Check if any cell has 0 width (newly added) - if so, distribute equally
      const hasZeroWidthCell = row.cells.some(c => c.widthPercent === 0)
      if (hasZeroWidthCell) {
        const equalWidth = 100 / row.cells.length
        row.cells.forEach(c => c.widthPercent = equalWidth)
      } else {
        // Normalize proportionally
        const totalWidth = row.cells.reduce((sum, c) => sum + c.widthPercent, 0)
        if (totalWidth > 0 && totalWidth !== 100) {
          row.cells.forEach(c => c.widthPercent = (c.widthPercent / totalWidth) * 100)
        }
      }
    })
  }

  // Update row sizes (from splitpanes resize event)
  function updateRowSizes(sizes: number[]) {
    if (!gridLayout.value) return
    gridLayout.value.rows.forEach((row, i) => {
      if (sizes[i] !== undefined) {
        row.heightPercent = sizes[i]
      }
    })
  }

  // Update cell sizes in a row (from splitpanes resize event)
  function updateCellSizes(rowId: string, sizes: number[]) {
    if (!gridLayout.value) return
    const row = gridLayout.value.rows.find(r => r.id === rowId)
    if (row) {
      row.cells.forEach((cell, i) => {
        if (sizes[i] !== undefined) {
          cell.widthPercent = sizes[i]
        }
      })
    }
  }

  // Drag state management
  function startDrag(terminalId: string) {
    dragState.value = {
      isDragging: true,
      sourceTerminalId: terminalId,
      dropTarget: null
    }
  }

  function setDropTarget(target: DropTarget | null) {
    dragState.value.dropTarget = target
  }

  function endDrag() {
    if (dragState.value.isDragging && dragState.value.sourceTerminalId && dragState.value.dropTarget) {
      moveTerminal(dragState.value.sourceTerminalId, dragState.value.dropTarget)
    }
    dragState.value = {
      isDragging: false,
      sourceTerminalId: null,
      dropTarget: null
    }
  }

  // Reorder terminals (tab dragging)
  function reorderTerminals(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    const [moved] = terminals.value.splice(fromIndex, 1)
    terminals.value.splice(toIndex, 0, moved)
  }

  function setTerminals(list: TerminalSession[]) {
    terminals.value = list
    if (list.length > 0 && !activeTerminalId.value) {
      activeTerminalId.value = list[0].id
    }
    // Initialize layout when terminals are set
    initializeLayout()
  }

  function addTerminal(session: TerminalSession) {
    terminals.value.push(session)
    activeTerminalId.value = session.id
    // Add to grid layout
    addTerminalToLayout(session.id)
  }

  function removeTerminal(id: string) {
    const index = terminals.value.findIndex(t => t.id === id)
    if (index !== -1) {
      terminals.value.splice(index, 1)
      // Remove from grid layout
      removeTerminalFromLayout(id)
      // Select adjacent terminal if active one was removed
      if (activeTerminalId.value === id) {
        if (terminals.value.length > 0) {
          const newIndex = Math.min(index, terminals.value.length - 1)
          activeTerminalId.value = terminals.value[newIndex].id
        } else {
          activeTerminalId.value = null
        }
      }
    }
  }

  function setActiveTerminal(id: string) {
    activeTerminalId.value = id
  }

  function nextTerminal() {
    if (terminals.value.length === 0) return
    const currentIndex = activeIndex.value
    const nextIndex = (currentIndex + 1) % terminals.value.length
    activeTerminalId.value = terminals.value[nextIndex].id
  }

  function prevTerminal() {
    if (terminals.value.length === 0) return
    const currentIndex = activeIndex.value
    const prevIndex = (currentIndex - 1 + terminals.value.length) % terminals.value.length
    activeTerminalId.value = terminals.value[prevIndex].id
  }

  function openAddDialog() {
    isAddDialogOpen.value = true
  }

  function closeAddDialog() {
    isAddDialogOpen.value = false
  }

  return {
    terminals,
    activeTerminalId,
    activeTerminal,
    activeIndex,
    isAddDialogOpen,
    // Grid layout
    gridLayout,
    dragState,
    // Methods
    setTerminals,
    addTerminal,
    removeTerminal,
    setActiveTerminal,
    nextTerminal,
    prevTerminal,
    openAddDialog,
    closeAddDialog,
    // Layout methods
    initializeLayout,
    updateRowSizes,
    updateCellSizes,
    startDrag,
    setDropTarget,
    endDrag,
    reorderTerminals
  }
})
