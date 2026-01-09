export interface TerminalSession {
  id: string;
  cwd: string;
  title: string;
  createdAt: Date;
}

export interface TerminalCreatePayload {
  cwd: string;
  title?: string;
}

export interface TerminalInputPayload {
  terminalId: string;
  data: string;
}

export interface TerminalResizePayload {
  terminalId: string;
  cols: number;
  rows: number;
}

export interface TerminalOutputPayload {
  terminalId: string;
  data: string;
}

export interface AuthPayload {
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface JwtPayload {
  authenticated: boolean;
  iat: number;
  exp: number;
}
