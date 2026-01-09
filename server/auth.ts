import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const TOKEN_EXPIRY = '24h';

export async function verifyPassword(password: string): Promise<boolean> {
  const storedHash = process.env.PASSWORD_HASH;

  if (!storedHash) {
    console.error('PASSWORD_HASH not set in environment variables');
    return false;
  }

  try {
    return await bcrypt.compare(password, storedHash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

export function generateToken(): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    authenticated: true
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  next();
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}
