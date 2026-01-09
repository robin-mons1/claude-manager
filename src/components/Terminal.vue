<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const props = defineProps<{
  terminalId: string
  isActive: boolean
  onInput: (data: string) => void
  onResize: (cols: number, rows: number) => void
  registerOutput: (handler: (data: string) => void) => void
  unregisterOutput: () => void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const mobileInputRef = ref<HTMLInputElement | null>(null)
let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let resizeObserver: ResizeObserver | null = null
let fitTimeout: ReturnType<typeof setTimeout> | null = null

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

function focusMobileInput() {
  if (isMobile && mobileInputRef.value) {
    mobileInputRef.value.focus()
  }
}

function handleMobileInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.value) {
    props.onInput(input.value)
    input.value = ''
  }
}

function handleMobileKeydown(e: KeyboardEvent) {
  // Handle special keys
  if (e.key === 'Enter') {
    props.onInput('\r')
    e.preventDefault()
  } else if (e.key === 'Backspace') {
    props.onInput('\x7f')
    e.preventDefault()
  } else if (e.key === 'Tab') {
    props.onInput('\t')
    e.preventDefault()
  } else if (e.key === 'Escape') {
    props.onInput('\x1b')
    e.preventDefault()
  } else if (e.key === 'ArrowUp') {
    props.onInput('\x1b[A')
    e.preventDefault()
  } else if (e.key === 'ArrowDown') {
    props.onInput('\x1b[B')
    e.preventDefault()
  } else if (e.key === 'ArrowRight') {
    props.onInput('\x1b[C')
    e.preventDefault()
  } else if (e.key === 'ArrowLeft') {
    props.onInput('\x1b[D')
    e.preventDefault()
  }
}

function handleOutput(data: string) {
  terminal?.write(data)
}

function fit() {
  if (fitAddon && containerRef.value) {
    try {
      fitAddon.fit()
      if (terminal) {
        props.onResize(terminal.cols, terminal.rows)
      }
    } catch {
      // Ignore fit errors during mount/unmount
    }
  }
}

// Debounced fit to prevent rapid resize loops
function debouncedFit() {
  if (fitTimeout) clearTimeout(fitTimeout)
  fitTimeout = setTimeout(() => {
    fit()
  }, 50)
}

onMounted(() => {
  if (!containerRef.value) return

  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: '#0d1117',
      foreground: '#e6edf3',
      cursor: '#58a6ff',
      cursorAccent: '#0d1117',
      selectionBackground: '#264f78',
      black: '#0d1117',
      red: '#f85149',
      green: '#3fb950',
      yellow: '#d29922',
      blue: '#58a6ff',
      magenta: '#bc8cff',
      cyan: '#39c5cf',
      white: '#e6edf3',
      brightBlack: '#484f58',
      brightRed: '#ff7b72',
      brightGreen: '#56d364',
      brightYellow: '#e3b341',
      brightBlue: '#79c0ff',
      brightMagenta: '#d2a8ff',
      brightCyan: '#56d4dd',
      brightWhite: '#ffffff'
    },
    scrollback: 5000,
    allowProposedApi: true
  })

  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(containerRef.value)

  terminal.onData((data) => {
    props.onInput(data)
  })

  props.registerOutput(handleOutput)

  // Set up resize observer with debounced fit
  resizeObserver = new ResizeObserver(() => {
    debouncedFit()
  })
  resizeObserver.observe(containerRef.value)

  nextTick(() => {
    fit()
    terminal?.focus()
  })
})

// Re-fit when becoming active
watch(() => props.isActive, (active) => {
  if (active) {
    nextTick(() => {
      fit()
      terminal?.focus()
    })
  }
})

onUnmounted(() => {
  props.unregisterOutput()
  resizeObserver?.disconnect()
  if (fitTimeout) clearTimeout(fitTimeout)
  terminal?.dispose()
})

defineExpose({
  focus: () => terminal?.focus(),
  fit
})
</script>

<template>
  <div
    class="terminal-wrapper"
    :class="{ active: isActive }"
    @click="focusMobileInput"
  >
    <div
      ref="containerRef"
      class="terminal-container"
    />
    <!-- Hidden input for mobile keyboard -->
    <input
      v-if="isMobile"
      ref="mobileInputRef"
      class="mobile-input"
      type="text"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      @input="handleMobileInput"
      @keydown="handleMobileKeydown"
    />
  </div>
</template>

<style scoped>
.terminal-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
}

.terminal-container {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
}

.mobile-input {
  position: absolute;
  opacity: 0;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
}
</style>
