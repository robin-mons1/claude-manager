<script setup lang="ts">
import { computed } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useTerminalsStore } from '@/stores/terminals'
import TerminalGridRow from './TerminalGridRow.vue'

const props = defineProps<{
  onInput: (terminalId: string) => (data: string) => void
  onResize: (terminalId: string) => (cols: number, rows: number) => void
  registerOutput: (terminalId: string) => (handler: (data: string) => void) => void
  unregisterOutput: (terminalId: string) => () => void
  onClose: (terminalId: string) => void
}>()

const terminalsStore = useTerminalsStore()

const layout = computed(() => terminalsStore.gridLayout)

function handleRowResize(event: { size: number }[]) {
  const sizes = event.map(e => e.size)
  terminalsStore.updateRowSizes(sizes)
}
</script>

<template>
  <div class="terminal-grid">
    <Splitpanes
      v-if="layout && layout.rows.length > 0"
      class="default-theme"
      horizontal
      @resize="handleRowResize"
    >
      <Pane
        v-for="row in layout.rows"
        :key="row.id"
        :size="row.heightPercent"
        :min-size="5"
      >
        <TerminalGridRow
          :row="row"
          :on-input="onInput"
          :on-resize="onResize"
          :register-output="registerOutput"
          :unregister-output="unregisterOutput"
          :on-close="onClose"
        />
      </Pane>
    </Splitpanes>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <p>No terminals open</p>
      <button class="add-btn-large" @click="terminalsStore.openAddDialog()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5a1 1 0 011-1z"/>
        </svg>
        Add Terminal
      </button>
    </div>
  </div>
</template>

<style scoped>
.terminal-grid {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.terminal-grid :deep(.splitpanes) {
  height: 100%;
  min-height: 0;
  flex: 1;
}

.terminal-grid :deep(.splitpanes__pane) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.terminal-grid :deep(.splitpanes--horizontal > .splitpanes__splitter) {
  min-height: 6px;
  background: var(--border);
  cursor: row-resize;
}

.terminal-grid :deep(.splitpanes--horizontal > .splitpanes__splitter:hover) {
  background: var(--accent);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-secondary);
}

.add-btn-large {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--accent);
  color: #000;
  font-weight: 600;
  padding: 12px 24px;
}

.add-btn-large:hover {
  background: var(--accent-hover);
}
</style>
