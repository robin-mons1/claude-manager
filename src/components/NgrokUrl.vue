<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const ngrokUrl = ref<string | null>(null)
const copied = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

async function fetchNgrokUrl() {
  try {
    const response = await fetch('/api/ngrok')
    const data = await response.json()
    ngrokUrl.value = data.url
  } catch (error) {
    console.error('Failed to fetch ngrok URL:', error)
  }
}

async function copyUrl() {
  if (!ngrokUrl.value) return

  try {
    await navigator.clipboard.writeText(ngrokUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

onMounted(() => {
  fetchNgrokUrl()
  // Poll every 5 seconds in case ngrok starts later
  pollInterval = setInterval(fetchNgrokUrl, 5000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<template>
  <div v-if="ngrokUrl" class="ngrok-container">
    <span class="ngrok-label">Ngrok:</span>
    <span class="ngrok-url">{{ ngrokUrl }}</span>
    <button class="copy-btn" @click="copyUrl" :class="{ copied }">
      <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.ngrok-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 12px;
}

.ngrok-label {
  color: var(--text-secondary);
}

.ngrok-url {
  color: var(--accent);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 4px;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.copy-btn.copied {
  color: var(--success);
}
</style>
