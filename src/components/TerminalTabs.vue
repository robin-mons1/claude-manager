<script setup lang="ts">
import { ref } from 'vue'
import { useTerminalsStore } from '@/stores/terminals'

defineProps<{
  onClose: (id: string) => void
}>()

const terminalsStore = useTerminalsStore()

const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function handleDragStart(e: DragEvent, index: number) {
  draggedIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

function handleDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  dragOverIndex.value = index
}

function handleDragLeave() {
  dragOverIndex.value = null
}

function handleDrop(e: DragEvent, toIndex: number) {
  e.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== toIndex) {
    terminalsStore.reorderTerminals(draggedIndex.value, toIndex)
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

function handleDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="tabs-container">
    <div class="tabs">
      <button
        v-for="(terminal, index) in terminalsStore.terminals"
        :key="terminal.id"
        class="tab"
        :class="{
          active: terminal.id === terminalsStore.activeTerminalId,
          dragging: draggedIndex === index,
          'drag-over': dragOverIndex === index && draggedIndex !== index
        }"
        draggable="true"
        @click="terminalsStore.setActiveTerminal(terminal.id)"
        @dragstart="handleDragStart($event, index)"
        @dragover="handleDragOver($event, index)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, index)"
        @dragend="handleDragEnd"
      >
        <span class="tab-title">{{ terminal.title }}</span>
        <button
          class="tab-close"
          @click.stop="onClose(terminal.id)"
          title="Close terminal"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3.293 3.293a1 1 0 011.414 0L7 5.586l2.293-2.293a1 1 0 111.414 1.414L8.414 7l2.293 2.293a1 1 0 01-1.414 1.414L7 8.414l-2.293 2.293a1 1 0 01-1.414-1.414L5.586 7 3.293 4.707a1 1 0 010-1.414z"/>
          </svg>
        </button>
      </button>

      <button class="tab add-tab" @click="terminalsStore.openAddDialog()" title="Add terminal">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 010-2h4V3a1 1 0 011-1z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tabs-container {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tabs {
  display: flex;
  min-width: min-content;
  padding: 8px 8px 0;
  gap: 4px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px 8px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  white-space: nowrap;
  min-width: 100px;
  max-width: 200px;
}

.tab:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.tab.active {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  background: transparent;
  padding: 2px;
  color: inherit;
  opacity: 0.5;
  flex-shrink: 0;
}

.tab-close:hover {
  opacity: 1;
  background: transparent;
}

.add-tab {
  padding: 8px 12px;
  min-width: auto;
  color: var(--accent);
}

.add-tab:hover {
  background: var(--bg-tertiary);
}

.tab.dragging {
  opacity: 0.5;
}

.tab.drag-over {
  border-left: 2px solid var(--accent);
}

.tab[draggable="true"] {
  cursor: grab;
}

.tab[draggable="true"]:active {
  cursor: grabbing;
}
</style>
