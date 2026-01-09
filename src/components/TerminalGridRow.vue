<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes'
import { useTerminalsStore } from '@/stores/terminals'
import TerminalGridCell from './TerminalGridCell.vue'
import type { GridRow } from '@/types/layout'

const props = defineProps<{
  row: GridRow
  onInput: (terminalId: string) => (data: string) => void
  onResize: (terminalId: string) => (cols: number, rows: number) => void
  registerOutput: (terminalId: string) => (handler: (data: string) => void) => void
  unregisterOutput: (terminalId: string) => () => void
  onClose: (terminalId: string) => void
}>()

const terminalsStore = useTerminalsStore()

function handleCellResize(event: { size: number }[]) {
  const sizes = event.map(e => e.size)
  terminalsStore.updateCellSizes(props.row.id, sizes)
}
</script>

<template>
  <div class="terminal-grid-row">
    <Splitpanes
      v-if="row.cells.length > 1"
      class="default-theme"
      @resize="handleCellResize"
    >
      <Pane
        v-for="cell in row.cells"
        :key="cell.terminalId"
        :size="cell.widthPercent"
        :min-size="10"
      >
        <TerminalGridCell
          :terminal-id="cell.terminalId"
          :row-id="row.id"
          :on-input="onInput(cell.terminalId)"
          :on-resize="onResize(cell.terminalId)"
          :register-output="registerOutput(cell.terminalId)"
          :unregister-output="unregisterOutput(cell.terminalId)"
          :on-close="() => onClose(cell.terminalId)"
        />
      </Pane>
    </Splitpanes>

    <!-- Single cell - no splitpanes needed -->
    <TerminalGridCell
      v-else-if="row.cells.length === 1"
      :terminal-id="row.cells[0].terminalId"
      :row-id="row.id"
      :on-input="onInput(row.cells[0].terminalId)"
      :on-resize="onResize(row.cells[0].terminalId)"
      :register-output="registerOutput(row.cells[0].terminalId)"
      :unregister-output="unregisterOutput(row.cells[0].terminalId)"
      :on-close="() => onClose(row.cells[0].terminalId)"
    />
  </div>
</template>

<style scoped>
.terminal-grid-row {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.terminal-grid-row :deep(.splitpanes) {
  height: 100%;
  width: 100%;
  min-height: 0;
}

.terminal-grid-row :deep(.splitpanes__pane) {
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.terminal-grid-row :deep(.splitpanes__splitter) {
  min-width: 6px;
  background: var(--border);
  cursor: col-resize;
}

.terminal-grid-row :deep(.splitpanes__splitter:hover) {
  background: var(--accent);
}
</style>
