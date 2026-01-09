# Claude Phone Hub

## Overview

A web-based terminal manager that allows you to run multiple terminal sessions on your PC and access them remotely from your mobile phone via ngrok. Built with Vue 3 and Node.js.

**Primary Use Case**: Host on your PC, access from your phone using ngrok URL. Password protected for security.

## Tech Stack

- **Frontend**: Vue 3, Pinia (state management), TypeScript, Vite
- **Backend**: Node.js, Express, Socket.io, node-pty
- **Terminal**: xterm.js with FitAddon for auto-sizing
- **UI Libraries**: Swiper (mobile), Splitpanes (desktop grid)
- **Tunneling**: ngrok (auto-started with server)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   Desktop View      │    │      Mobile View            │ │
│  │   (Grid Layout)     │    │      (Swiper Tabs)          │ │
│  │   - Splitpanes      │    │      - Touch swipe          │ │
│  │   - Drag to arrange │    │      - Hidden input for KB  │ │
│  │   - Resize handles  │    │                             │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│                              │                               │
│                    Socket.io + REST API                      │
└──────────────────────────────┼───────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────┐
│                        Server                                │
│  ┌─────────────┐    ┌────────────────┐    ┌───────────────┐ │
│  │   Express   │    │   Socket.io    │    │   node-pty    │ │
│  │   - Auth    │    │   - Terminal   │    │   - Spawn     │ │
│  │   - Ngrok   │    │     events     │    │     shells    │ │
│  └─────────────┘    └────────────────┘    └───────────────┘ │
│                                                              │
│  Auto-starts ngrok tunnel → Displays URL in UI               │
└──────────────────────────────────────────────────────────────┘
```

## Key Features

### Desktop View
- **Grid Layout**: Terminals arranged in resizable split panes
- **Auto-arrange**: New terminals auto-distribute (1=100%, 2=50/50, 3=33/33/33)
- **Drag to Rearrange**: Drag terminal headers to move them (left/right within row, top/bottom for new rows)
- **Resize**: Drag borders between terminals to resize
- **Keyboard Shortcut**: Ctrl+D opens add terminal dialog

### Mobile View
- **Swiper**: Swipe left/right to switch terminals
- **Hidden Input**: Tap terminal to show keyboard (mobile keyboards need a real input element)
- **Touch Optimized**: Large touch targets, momentum scrolling

### Ngrok Integration
- Server auto-starts ngrok on startup
- Tunnels to Vite dev server (port 5173) in dev mode
- Tunnels to Express (port 3000) in production
- Displays ngrok URL in header with copy button

### Authentication
- Password-based auth with bcrypt hashing
- JWT tokens for session management
- Socket.io connections require valid token

## File Structure

```
├── server/
│   ├── index.ts          # Express server, Socket.io, ngrok startup
│   ├── auth.ts           # Password verification, JWT generation
│   ├── terminal-manager.ts # node-pty process management
│   └── types.ts          # Shared types
├── src/
│   ├── components/
│   │   ├── Terminal.vue       # xterm.js wrapper with FitAddon
│   │   ├── TerminalGrid.vue   # Desktop grid container (vertical splitpanes)
│   │   ├── TerminalGridRow.vue    # Row with horizontal splitpanes
│   │   ├── TerminalGridCell.vue   # Cell with drag handle, wraps Terminal
│   │   ├── TerminalDropZone.vue   # Visual drop indicators for drag-and-drop
│   │   ├── TerminalSwiper.vue # Mobile swiper view
│   │   ├── LoginPage.vue      # Password login
│   │   ├── AddTerminal.vue    # Dialog to create new terminal
│   │   └── NgrokUrl.vue       # Displays ngrok URL with copy button
│   ├── stores/
│   │   ├── auth.ts        # Auth state, login/logout
│   │   └── terminals.ts   # Terminal list, grid layout state, drag state
│   ├── composables/
│   │   └── useSocket.ts   # Socket.io connection, terminal commands
│   ├── types/
│   │   ├── layout.ts      # GridLayout, GridRow, GridCell, DragState types
│   │   └── splitpanes.d.ts # TypeScript declarations for splitpanes
│   ├── App.vue            # Main layout, desktop/mobile switching
│   └── style.css          # CSS variables, global styles
├── scripts/
│   └── setup-password.ts  # Generate PASSWORD_HASH for .env
├── vite.config.ts         # Vite config with proxy and allowedHosts
└── package.json
```

## Important Implementation Details

### Mobile Keyboard Support
xterm.js uses canvas which doesn't trigger mobile keyboards. Solution in `Terminal.vue`:
- Hidden `<input>` element positioned over terminal
- On tap, focus the hidden input to trigger keyboard
- Input events forwarded to terminal via `onInput` prop
- Special key handling (Enter, Backspace, Arrow keys) via keydown

### Grid Layout State
Stored in `terminalsStore.gridLayout`:
```typescript
interface GridLayout {
  rows: GridRow[]
}
interface GridRow {
  id: string
  cells: GridCell[]
  heightPercent: number
}
interface GridCell {
  terminalId: string
  widthPercent: number
}
```

### Drag and Drop
- Drag starts from cell header (`TerminalGridCell`)
- Drop zones appear on other cells (`TerminalDropZone`)
- Drop zones: before, after (same row), new-row-above, new-row-below
- On drop, `moveTerminal()` updates layout and `normalizeLayout()` redistributes sizes

### Socket.io Events
- `terminal:list` - Server sends current terminals on connect
- `terminal:create` - Client requests new terminal
- `terminal:created` - Server confirms terminal created
- `terminal:input` - Client sends keystrokes
- `terminal:output` - Server sends terminal output
- `terminal:resize` - Client sends new dimensions
- `terminal:destroy` - Client requests terminal close
- `terminal:destroyed` - Server confirms terminal closed

### Ngrok URL Detection
Server spawns ngrok with `--log stdout` and parses output for URL pattern:
```typescript
const urlMatch = output.match(/url=(https:\/\/[^\s]+\.ngrok[^\s]*)/)
```

## Development

```bash
# Install dependencies
npm install

# Set up password (creates .env with PASSWORD_HASH and JWT_SECRET)
npm run setup

# Start dev server (runs both Vite and Express concurrently)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Configuration

### Vite Config (`vite.config.ts`)
- `allowedHosts: true` - Required for ngrok access
- Proxy `/api` and `/socket.io` to Express server

### Environment Variables (`.env`)
- `PASSWORD_HASH` - bcrypt hash of access password
- `JWT_SECRET` - Secret for signing JWT tokens
- `PORT` - Server port (default 3000)
- `NODE_ENV` - Set to "production" for production builds

## CSS Theme

Dark theme with CSS variables in `style.css`:
```css
:root {
  --bg-primary: #0d1117;    /* Terminal background */
  --bg-secondary: #161b22;  /* Headers, tabs */
  --bg-tertiary: #21262d;   /* Buttons, hover states */
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --accent: #58a6ff;        /* Links, active states */
  --success: #3fb950;       /* Connected status */
  --danger: #f85149;        /* Errors, close buttons */
  --border: #30363d;
}
```

## Known Considerations

1. **ngrok Free Tier**: URL changes on each restart. Consider ngrok paid plan for static URL.
2. **Terminal Resize**: Uses debounced ResizeObserver to prevent excessive refit calls.
3. **Mobile Detection**: Based on window width < 768px, not user agent.
4. **Socket Reconnection**: 5 attempts with 1s delay before giving up.
