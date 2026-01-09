<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { useTerminalsStore } from '@/stores/terminals'
import 'swiper/css'
import 'swiper/css/pagination'

const props = defineProps<{
  onClose: (id: string) => void
}>()

const terminalsStore = useTerminalsStore()
const swiperRef = ref<SwiperType | null>(null)

function onSwiper(swiper: SwiperType) {
  swiperRef.value = swiper
}

function onSlideChange(swiper: SwiperType) {
  const terminal = terminalsStore.terminals[swiper.activeIndex]
  if (terminal) {
    terminalsStore.setActiveTerminal(terminal.id)
  }
}

// Sync swiper position when active terminal changes externally
watch(() => terminalsStore.activeIndex, (index) => {
  if (index >= 0 && swiperRef.value && swiperRef.value.activeIndex !== index) {
    swiperRef.value.slideTo(index)
  }
})

onMounted(() => {
  if (swiperRef.value && terminalsStore.activeIndex >= 0) {
    swiperRef.value.slideTo(terminalsStore.activeIndex)
  }
})
</script>

<template>
  <div class="swiper-container">
    <!-- Header with current terminal info -->
    <div class="swiper-header">
      <div class="terminal-info">
        <span class="terminal-title">{{ terminalsStore.activeTerminal?.title || 'No Terminal' }}</span>
        <span class="terminal-count">{{ terminalsStore.activeIndex + 1 }} / {{ terminalsStore.terminals.length }}</span>
      </div>
      <div class="header-actions">
        <button
          v-if="terminalsStore.activeTerminal"
          class="action-btn close-btn"
          @click="onClose(terminalsStore.activeTerminal.id)"
          title="Close terminal"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
          </svg>
        </button>
        <button class="action-btn add-btn" @click="terminalsStore.openAddDialog()" title="Add terminal">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Swipe hint -->
    <div v-if="terminalsStore.terminals.length > 1" class="swipe-hint">
      <span>Swipe left/right to switch terminals</span>
    </div>

    <!-- Swiper for terminals -->
    <Swiper
      v-if="terminalsStore.terminals.length > 0"
      :modules="[Pagination]"
      :slides-per-view="1"
      :space-between="0"
      :pagination="{ clickable: true }"
      class="terminal-swiper"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
    >
      <SwiperSlide v-for="terminal in terminalsStore.terminals" :key="terminal.id">
        <div class="slide-content">
          <slot :terminal-id="terminal.id" :is-active="terminal.id === terminalsStore.activeTerminalId" />
        </div>
      </SwiperSlide>
    </Swiper>

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
.swiper-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.swiper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.terminal-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.terminal-title {
  font-weight: 600;
  font-size: 16px;
}

.terminal-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: var(--bg-tertiary);
  padding: 8px;
  border-radius: 8px;
}

.close-btn {
  color: var(--danger);
}

.add-btn {
  color: var(--accent);
}

.swipe-hint {
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.terminal-swiper {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
}

:deep(.swiper-wrapper) {
  height: 100%;
}

:deep(.swiper-slide) {
  height: 100%;
  width: 100%;
}

.slide-content {
  height: 100%;
  width: 100%;
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

/* Swiper pagination customization */
:deep(.swiper-pagination) {
  bottom: 8px !important;
}

:deep(.swiper-pagination-bullet) {
  background: var(--text-secondary);
  opacity: 0.5;
}

:deep(.swiper-pagination-bullet-active) {
  background: var(--accent);
  opacity: 1;
}
</style>
