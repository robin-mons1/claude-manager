<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const password = ref('')

async function handleLogin() {
  if (!password.value) return
  await authStore.login(password.value)
  password.value = ''
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo">
        <svg viewBox="0 0 100 100" class="logo-icon">
          <rect width="100" height="100" rx="20" fill="var(--bg-tertiary)"/>
          <text x="50" y="65" font-family="monospace" font-size="50" fill="var(--accent)" text-anchor="middle">C</text>
          <circle cx="75" cy="25" r="8" fill="var(--success)"/>
        </svg>
        <h1>Claude Manager</h1>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <input
            v-model="password"
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
            :disabled="authStore.isLoading"
          />
        </div>

        <p v-if="authStore.error" class="error">{{ authStore.error }}</p>

        <button type="submit" :disabled="authStore.isLoading || !password">
          {{ authStore.isLoading ? 'Authenticating...' : 'Login' }}
        </button>
      </form>

      <p class="hint">Access your Claude Code terminals remotely</p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 360px;
  text-align: center;
}

.logo {
  margin-bottom: 32px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

.logo h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group input {
  text-align: center;
  font-size: 16px;
  padding: 14px;
}

.error {
  color: var(--danger);
  font-size: 14px;
  margin: 0;
}

.login-form button {
  background: var(--accent);
  color: #000;
  font-weight: 600;
  padding: 14px;
  font-size: 16px;
}

.login-form button:hover:not(:disabled) {
  background: var(--accent-hover);
}

.hint {
  margin-top: 24px;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
