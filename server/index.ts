import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn, ChildProcess } from 'child_process';
import { verifyPassword, generateToken, verifyToken } from './auth.js';
import { terminalManager } from './terminal-manager.js';

let ngrokUrl: string | null = null;
let ngrokProcess: ChildProcess | null = null;
import type {
  TerminalCreatePayload,
  TerminalInputPayload,
  TerminalResizePayload,
  AuthPayload,
  AuthResponse
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
}

// Auth endpoint
app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body as AuthPayload;

  if (!password) {
    const response: AuthResponse = { success: false, error: 'Password required' };
    res.status(400).json(response);
    return;
  }

  const valid = await verifyPassword(password);

  if (!valid) {
    const response: AuthResponse = { success: false, error: 'Invalid password' };
    res.status(401).json(response);
    return;
  }

  const token = generateToken();
  const response: AuthResponse = { success: true, token };
  res.json(response);
});

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', terminals: terminalManager.getAllTerminals().length });
});

// Ngrok URL endpoint
app.get('/api/ngrok', (_, res) => {
  res.json({ url: ngrokUrl });
});

// Start ngrok and capture URL
async function startNgrok(): Promise<void> {
  return new Promise((resolve) => {
    // In dev mode, tunnel to Vite dev server (5173) which proxies API calls to backend
    // In production, tunnel to the backend which serves static files
    const ngrokPort = process.env.NODE_ENV === 'production' ? PORT : 5173;
    console.log(`Starting ngrok on port ${ngrokPort}...`);

    ngrokProcess = spawn('ngrok', ['http', String(ngrokPort), '--log', 'stdout'], {
      shell: true
    });

    let outputBuffer = '';

    ngrokProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      outputBuffer += output;

      // Look for the URL in ngrok output
      const urlMatch = output.match(/url=(https:\/\/[^\s]+\.ngrok[^\s]*)/);
      if (urlMatch && !ngrokUrl) {
        ngrokUrl = urlMatch[1];
        console.log(`\n🌐 Ngrok URL: ${ngrokUrl}\n`);
        resolve();
      }
    });

    ngrokProcess.stderr?.on('data', (data: Buffer) => {
      console.error('Ngrok error:', data.toString());
    });

    ngrokProcess.on('error', (err) => {
      console.error('Failed to start ngrok:', err.message);
      console.log('Make sure ngrok is installed: https://ngrok.com/download');
      resolve();
    });

    ngrokProcess.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`Ngrok exited with code ${code}`);
      }
      ngrokUrl = null;
      ngrokProcess = null;
    });

    // Timeout if URL not found in 10 seconds
    setTimeout(() => {
      if (!ngrokUrl) {
        console.log('Ngrok URL not detected yet. Check ngrok dashboard or logs.');
        resolve();
      }
    }, 10000);
  });
}

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token as string;

  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    next(new Error('Invalid token'));
    return;
  }

  next();
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current terminal list
  socket.emit('terminal:list', terminalManager.getAllTerminals());

  // Create new terminal
  socket.on('terminal:create', (payload: TerminalCreatePayload) => {
    try {
      const session = terminalManager.createTerminal(payload.cwd, payload.title);
      io.emit('terminal:created', session);
    } catch (error) {
      socket.emit('error', { message: 'Failed to create terminal', error: String(error) });
    }
  });

  // Handle terminal input
  socket.on('terminal:input', (payload: TerminalInputPayload) => {
    terminalManager.writeToTerminal(payload.terminalId, payload.data);
  });

  // Handle terminal resize
  socket.on('terminal:resize', (payload: TerminalResizePayload) => {
    terminalManager.resizeTerminal(payload.terminalId, payload.cols, payload.rows);
  });

  // Destroy terminal
  socket.on('terminal:destroy', (terminalId: string) => {
    const destroyed = terminalManager.destroyTerminal(terminalId);
    if (destroyed) {
      io.emit('terminal:destroyed', terminalId);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Forward terminal output to all clients
terminalManager.on('output', (payload) => {
  io.emit('terminal:output', payload);
});

terminalManager.on('exit', (payload) => {
  io.emit('terminal:exited', payload);
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  terminalManager.destroyAll();
  if (ngrokProcess) {
    ngrokProcess.kill();
    ngrokProcess = null;
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
httpServer.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');

  // Start ngrok tunnel
  await startNgrok();
});
