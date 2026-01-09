import * as pty from 'node-pty';
import * as os from 'os';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { TerminalSession } from './types.js';

interface ManagedTerminal {
  session: TerminalSession;
  ptyProcess: pty.IPty;
}

export class TerminalManager extends EventEmitter {
  private terminals: Map<string, ManagedTerminal> = new Map();
  private shell: string;

  constructor() {
    super();
    // Use cmd.exe on Windows to avoid PowerShell execution policy issues
    this.shell = process.platform === 'win32' ? 'cmd.exe' : 'bash';
  }

  createTerminal(cwd: string, title?: string): TerminalSession {
    const id = uuidv4();
    const isWindows = process.platform === 'win32';

    // Determine if this is a Claude terminal or plain cmd
    const isClaudeTerminal = cwd.trim().length > 0;
    const effectiveCwd = isClaudeTerminal ? cwd : os.homedir();

    const session: TerminalSession = {
      id,
      cwd: effectiveCwd,
      title: title || (isClaudeTerminal ? this.extractFolderName(cwd) : 'Command Prompt'),
      createdAt: new Date()
    };

    // Spawn claude for project terminals, plain cmd for empty path
    const ptyProcess = pty.spawn(
      isWindows ? 'cmd.exe' : (isClaudeTerminal ? 'claude' : 'bash'),
      isWindows ? (isClaudeTerminal ? ['/c', 'claude'] : []) : [],
      {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: effectiveCwd,
        env: process.env as { [key: string]: string }
      }
    );

    // Handle output from the terminal
    ptyProcess.onData((data) => {
      this.emit('output', { terminalId: id, data });
    });

    // Handle terminal exit
    ptyProcess.onExit(({ exitCode }) => {
      console.log(`Terminal ${id} exited with code ${exitCode}`);
      this.terminals.delete(id);
      this.emit('exit', { terminalId: id, exitCode });
    });

    this.terminals.set(id, { session, ptyProcess });
    console.log(`Created ${isClaudeTerminal ? 'Claude' : 'cmd'} terminal ${id} in ${effectiveCwd}`);

    return session;
  }

  destroyTerminal(terminalId: string): boolean {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return false;
    }

    terminal.ptyProcess.kill();
    this.terminals.delete(terminalId);
    console.log(`Destroyed terminal ${terminalId}`);
    return true;
  }

  writeToTerminal(terminalId: string, data: string): boolean {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return false;
    }

    terminal.ptyProcess.write(data);
    return true;
  }

  resizeTerminal(terminalId: string, cols: number, rows: number): boolean {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return false;
    }

    terminal.ptyProcess.resize(cols, rows);
    return true;
  }

  getTerminal(terminalId: string): TerminalSession | undefined {
    return this.terminals.get(terminalId)?.session;
  }

  getAllTerminals(): TerminalSession[] {
    return Array.from(this.terminals.values()).map(t => t.session);
  }

  destroyAll(): void {
    for (const [id] of this.terminals) {
      this.destroyTerminal(id);
    }
  }

  private extractFolderName(path: string): string {
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
    return parts[parts.length - 1] || path;
  }
}

export const terminalManager = new TerminalManager();
