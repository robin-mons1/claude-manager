<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTerminalsStore } from '@/stores/terminals'

const props = defineProps<{
  type: 'before' | 'after' | 'new-row-above' | 'new-row-below'
  targetRowId: string
  targetTerminalId?: string
}>()

const terminalsStore = useTerminalsStore()
const isHovering = ref(false)

const isActive = computed(() => {
  const dropTarget = terminalsStore.dragState.dropTarget
  if (!dropTarget) return false
  return (
    dropTarget.type === props.type &&
    dropTarget.targetRowId === props.targetRowId &&
    dropTarget.targetTerminalId === props.targetTerminalId
  )
})

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  isHovering.value = true
  terminalsStore.setDropTarget({
    type: props.type,
    targetRowId: props.targetRowId,
    targetTerminalId: props.targetTerminalId
  })
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isHovering.value = false
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isHovering.value = false
  // Trigger the move
  terminalsStore.endDrag()
}
</script>

<template>
  <div
    class="drop-zone"
    :class="[type, { active: isActive, hovering: isHovering }]"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <div class="drop-indicator" />
  </div>
</template>

<style scoped>
.drop-zone {
  position: absolute;
  z-index: 10;
  pointer-events: auto;
}

.drop-zone.before {
  left: 0;
  top: 0;
  bottom: 0;
  width: 30%;
}

.drop-zone.after {
  right: 0;
  top: 0;
  bottom: 0;
  width: 30%;
}

.drop-zone.new-row-above {
  left: 0;
  right: 0;
  top: 0;
  height: 25%;
}

.drop-zone.new-row-below {
  left: 0;
  right: 0;
  bottom: 0;
  height: 25%;
}

.drop-indicator {
  position: absolute;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.15s;
}

.drop-zone.before .drop-indicator {
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.drop-zone.after .drop-indicator {
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.drop-zone.new-row-above .drop-indicator {
  left: 0;
  right: 0;
  top: 0;
  height: 4px;
}

.drop-zone.new-row-below .drop-indicator {
  left: 0;
  right: 0;
  bottom: 0;
  height: 4px;
}

.drop-zone.hovering .drop-indicator,
.drop-zone.active .drop-indicator {
  opacity: 1;
}
</style>
