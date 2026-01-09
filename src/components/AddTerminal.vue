<script setup lang="ts">
import { ref } from 'vue'
import { useTerminalsStore } from '@/stores/terminals'

const props = defineProps<{
  onCreate: (cwd: string, title?: string) => void
}>()

const terminalsStore = useTerminalsStore()
const cwd = ref('')
const title = ref('')

function handleSubmit() {
  props.onCreate(cwd.value.trim(), title.value.trim() || undefined)
  cwd.value = ''
  title.value = ''
  terminalsStore.closeAddDialog()
}

function handleClose() {
  cwd.value = ''
  title.value = ''
  terminalsStore.closeAddDialog()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="terminalsStore.isAddDialogOpen" class="dialog-overlay" @click.self="handleClose">
      <div class="dialog">
        <div class="dialog-header">
          <h2>New Terminal</h2>
          <button class="close-btn" @click="handleClose">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="dialog-form">
          <div class="form-group">
            <label for="cwd">Project Directory</label>
            <input
              id="cwd"
              v-model="cwd"
              type="text"
              placeholder="C:\path\to\project (leave empty for plain cmd)"
              autofocus
            />
            <span class="hint">Full path for Claude terminal, or leave empty for plain cmd</span>
          </div>

          <div class="form-group">
            <label for="title">Title (optional)</label>
            <input
              id="title"
              v-model="title"
              type="text"
              placeholder="My Project"
            />
            <span class="hint">Display name for this terminal</span>
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn-secondary" @click="handleClose">Cancel</button>
            <button type="submit" class="btn-primary">Create Terminal</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.dialog-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  padding: 4px;
  color: var(--text-secondary);
}

.close-btn:hover {
  color: var(--text-primary);
  background: transparent;
}

.dialog-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.form-group .hint {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-secondary {
  background: var(--bg-tertiary);
}

.btn-primary {
  background: var(--accent);
  color: #000;
  font-weight: 600;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}
</style>
