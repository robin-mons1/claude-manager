import { ref, onUnmounted, watch } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useTerminalsStore } from '@/stores/terminals'
import type { TerminalSession } from '@/stores/terminals'

interface TerminalOutputPayload {
  terminalId: string
  data: string
}

interface TerminalExitPayload {
  terminalId: string
  exitCode: number
}

type OutputHandler = (data: string) => void

export function useSocket() {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const connectionError = ref<string | null>(null)

  const authStore = useAuthStore()
  const terminalsStore = useTerminalsStore()

  const outputHandlers = new Map<string, OutputHandler>()

  function connect() {
    if (socket.value?.connected) return

    // Use localhost:3000 only when actually on localhost, otherwise use current origin (for ngrok access)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const serverUrl = isLocalhost ? 'http://localhost:3000' : window.location.origin

    socket.value = io(serverUrl, {
      auth: { token: authStore.token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socket.value.on('connect', () => {
      isConnected.value = true
      connectionError.value = null
      console.log('Connected to server')
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
      console.log('Disconnected from server')
    })

    socket.value.on('connect_error', (err) => {
      connectionError.value = err.message
      console.error('Connection error:', err.message)
      if (err.message.includes('Authentication') || err.message.includes('token')) {
        authStore.logout()
      }
    })

    socket.value.on('terminal:list', (list: TerminalSession[]) => {
      terminalsStore.setTerminals(list)
    })

    socket.value.on('terminal:created', (session: TerminalSession) => {
      terminalsStore.addTerminal(session)
    })

    socket.value.on('terminal:destroyed', (terminalId: string) => {
      terminalsStore.removeTerminal(terminalId)
    })

    socket.value.on('terminal:output', (payload: TerminalOutputPayload) => {
      const handler = outputHandlers.get(payload.terminalId)
      if (handler) {
        handler(payload.data)
      }
    })

    socket.value.on('terminal:exited', (payload: TerminalExitPayload) => {
      console.log(`Terminal ${payload.terminalId} exited with code ${payload.exitCode}`)
    })

    socket.value.on('error', (err: { message: string }) => {
      console.error('Socket error:', err.message)
    })
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  function createTerminal(cwd: string, title?: string) {
    socket.value?.emit('terminal:create', { cwd, title })
  }

  function destroyTerminal(terminalId: string) {
    socket.value?.emit('terminal:destroy', terminalId)
  }

  function sendInput(terminalId: string, data: string) {
    socket.value?.emit('terminal:input', { terminalId, data })
  }

  function resizeTerminal(terminalId: string, cols: number, rows: number) {
    socket.value?.emit('terminal:resize', { terminalId, cols, rows })
  }

  function registerOutputHandler(terminalId: string, handler: OutputHandler) {
    outputHandlers.set(terminalId, handler)
  }

  function unregisterOutputHandler(terminalId: string) {
    outputHandlers.delete(terminalId)
  }

  // Auto-connect when authenticated
  watch(() => authStore.isAuthenticated, (authenticated) => {
    if (authenticated) {
      connect()
    } else {
      disconnect()
    }
  }, { immediate: true })

  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    createTerminal,
    destroyTerminal,
    sendInput,
    resizeTerminal,
    registerOutputHandler,
    unregisterOutputHandler
  }
}
