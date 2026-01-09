import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'claude-hub-token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        error.value = data.error || 'Login failed'
        return false
      }

      token.value = data.token
      localStorage.setItem(TOKEN_KEY, data.token)
      return true
    } catch (err) {
      error.value = 'Connection error'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return {
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout
  }
})
