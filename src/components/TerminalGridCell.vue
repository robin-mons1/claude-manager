<script setup lang="ts">
import { computed } from 'vue'
import { useTerminalsStore } from '@/stores/terminals'
import Terminal from './Terminal.vue'
import TerminalDropZone from './TerminalDropZone.vue'

const props = defineProps<{
  terminalId: string
  rowId: string
  onInput: (data: string) => void
  onResize: (cols: number, rows: number) => void
  registerOutput: (handler: (data: string) => void) => void
  unregisterOutput: () => void
  onClose: () => void
}>()

const terminalsStore = useTerminalsStore()

const terminal = computed(() =>
  terminalsStore.terminals.find(t => t.id === props.terminalId)
)

const isDragging = computed(() => terminalsStore.dragState.isDragging)
const isBeingDragged = computed(() =>
  terminalsStore.dragState.sourceTerminalId === props.terminalId
)

function handleDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.terminalId)
  }
  terminalsStore.startDrag(props.terminalId)
}

function handleDragEnd() {
  terminalsStore.endDrag()
}
</script>

<template>
  <div
    class="terminal-grid-cell"
    :class="{ dragging: isBeingDragged }"
  >
    <!-- Drag handle header -->
    <div
      class="cell-header"
      draggable="true"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
    >
      <span class="cell-title">{{ terminal?.title || 'Terminal' }}</span>
      <button class="cell-close" @click="onClose" title="Close terminal">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
        </svg>
      </button>
    </div>

    <!-- Terminal content -->
    <div class="cell-content">
      <Terminal
        :terminal-id="terminalId"
        :is-active="true"
        :on-input="onInput"
        :on-resize="onResize"
        :register-output="registerOutput"
        :unregister-output="unregisterOutput"
      />
    </div>

    <!-- Drop zones (visible when dragging another terminal) -->
    <template v-if="isDragging && !isBeingDragged">
      <TerminalDropZone
        type="before"
        :target-row-id="rowId"
        :target-terminal-id="terminalId"
      />
      <TerminalDropZone
        type="after"
        :target-row-id="rowId"
        :target-terminal-id="terminalId"
      />
      <TerminalDropZone
        type="new-row-above"
        :target-row-id="rowId"
        :target-terminal-id="terminalId"
      />
      <TerminalDropZone
        type="new-row-below"
        :target-row-id="rowId"
        :target-terminal-id="terminalId"
      />
    </template>
  </div>
</template>

<style scoped>
.terminal-grid-cell {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--bg-primary);
  overflow: hidden;
}

.terminal-grid-cell.dragging {
  opacity: 0.5;
}

.cell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
}

.cell-header:active {
  cursor: grabbing;
}

.cell-title {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-close {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 4px;
}

.cell-close:hover {
  background: var(--bg-tertiary);
  color: var(--danger);
}

.cell-content {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
</style>
