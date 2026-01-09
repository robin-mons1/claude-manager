<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTerminalsStore } from '@/stores/terminals'
import { useSocket } from '@/composables/useSocket'
import LoginPage from '@/components/LoginPage.vue'
import Terminal from '@/components/Terminal.vue'
import TerminalSwiper from '@/components/TerminalSwiper.vue'
import TerminalGrid from '@/components/TerminalGrid.vue'
import AddTerminal from '@/components/AddTerminal.vue'
import NgrokUrl from '@/components/NgrokUrl.vue'

const authStore = useAuthStore()
const terminalsStore = useTerminalsStore()
const { isConnected, connectionError, createTerminal, destroyTerminal, sendInput, resizeTerminal, registerOutputHandler, unregisterOutputHandler } = useSocket()

const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

function handleCreateTerminal(cwd: string, title?: string) {
  createTerminal(cwd, title)
}

function handleCloseTerminal(id: string) {
  destroyTerminal(id)
}

function handleInput(terminalId: string) {
  return (data: string) => {
    sendInput(terminalId, data)
  }
}

function handleResize(terminalId: string) {
  return (cols: number, rows: number) => {
    resizeTerminal(terminalId, cols, rows)
  }
}

function handleRegisterOutput(terminalId: string) {
  return (handler: (data: string) => void) => {
    registerOutputHandler(terminalId, handler)
  }
}

function handleUnregisterOutput(terminalId: string) {
  return () => {
    unregisterOutputHandler(terminalId)
  }
}

function handleLogout() {
  authStore.logout()
}

function handleKeydown(e: KeyboardEvent) {
  // Ctrl+D to add new terminal
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault()
    if (authStore.isAuthenticated) {
      terminalsStore.openAddDialog()
    }
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  // Use capture phase to intercept before xterm.js handles it
  window.addEventListener('keydown', handleKeydown, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', handleKeydown, true)
})
</script>

<template>
  <div class="app">
    <!-- Login Page -->
    <LoginPage v-if="!authStore.isAuthenticated" />

    <!-- Main App -->
    <template v-else>
      <!-- Connection status bar -->
      <div v-if="!isConnected || connectionError" class="status-bar" :class="{ error: connectionError }">
        <span v-if="connectionError">Connection error: {{ connectionError }}</span>
        <span v-else>Connecting...</span>
      </div>

      <!-- Desktop Layout -->
      <template v-if="!isMobile">
        <header class="header">
          <div class="header-left">
            <h1>Claude Manager</h1>
          </div>
          <div class="header-right">
            <button class="add-terminal-btn" @click="terminalsStore.openAddDialog()" title="Add Terminal (Ctrl+D)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5a1 1 0 011-1z"/>
              </svg>
              Add Terminal
            </button>
            <NgrokUrl />
            <span class="connection-status" :class="{ connected: isConnected }">
              {{ isConnected ? 'Connected' : 'Disconnected' }}
            </span>
            <button class="logout-btn" @click="handleLogout">Logout</button>
          </div>
        </header>

        <main class="main-content">
          <TerminalGrid
            :on-input="handleInput"
            :on-resize="handleResize"
            :register-output="handleRegisterOutput"
            :unregister-output="handleUnregisterOutput"
            :on-close="handleCloseTerminal"
          />
        </main>
      </template>

      <!-- Mobile Layout -->
      <template v-else>
        <TerminalSwiper :on-close="handleCloseTerminal">
          <template #default="{ terminalId, isActive }">
            <Terminal
              :terminal-id="terminalId"
              :is-active="isActive"
              :on-input="handleInput(terminalId)"
              :on-resize="handleResize(terminalId)"
              :register-output="handleRegisterOutput(terminalId)"
              :unregister-output="handleUnregisterOutput(terminalId)"
            />
          </template>
        </TerminalSwiper>
      </template>

      <!-- Add Terminal Dialog -->
      <AddTerminal :on-create="handleCreateTerminal" />
    </template>
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.status-bar {
  padding: 8px 16px;
  background: var(--accent);
  color: #000;
  text-align: center;
  font-size: 14px;
}

.status-bar.error {
  background: var(--danger);
  color: #fff;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.header-left h1 {
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.connection-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  background: var(--danger);
  color: #fff;
}

.connection-status.connected {
  background: var(--success);
}

.logout-btn {
  font-size: 14px;
  padding: 6px 12px;
}

.add-terminal-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--accent);
  color: #000;
  font-weight: 600;
  font-size: 14px;
  padding: 6px 12px;
}

.add-terminal-btn:hover {
  background: var(--accent-hover);
}

.main-content {
  flex: 1;
  min-height: 0;
  position: relative;
}

.empty-state {
  position: absolute;
  inset: 0;
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
