import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db';

const activeSessions = new Map<string, { email: string; createdAt: number }>();
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function createSession(email: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, {
    email,
    createdAt: Date.now(),
  });
  return token;
}

export function destroySession(token: string): void {
  activeSessions.delete(token);
}

export function getSession(token: string): { email: string } | null {
  const session = activeSessions.get(token);
  if (!session) return null;
  // Expire after 24 hours
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    activeSessions.delete(token);
    return null;
  }
  return { email: session.email };
}

export function checkBruteForce(ip: string): { isLocked: boolean; remainingSeconds: number } {
  const record = failedAttempts.get(ip);
  if (!record) return { isLocked: false, remainingSeconds: 0 };

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    if (Date.now() < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
      return { isLocked: true, remainingSeconds };
    } else {
      // Lockout expired, reset
      failedAttempts.delete(ip);
    }
  }
  return { isLocked: false, remainingSeconds: 0 };
}

export function recordFailedAttempt(ip: string): void {
  const record = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  failedAttempts.set(ip, record);
}

export function resetFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.claimscure_admin_session) {
    token = req.cookies.claimscure_admin_session;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Super Admin session required.' });
    return;
  }

  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid.' });
    return;
  }

  (req as any).adminEmail = session.email;
  (req as any).sessionToken = token;
  next();
}

export function getAdminEmailFromEnv(): string {
  return process.env.ADMIN_EMAIL || '';
}

export function validateAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('[Auth] ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    return false;
  }

  return email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword;
}

export function logActivity(action: string, details: string, adminEmail: string = getAdminEmailFromEnv() || 'admin', ip: string = '127.0.0.1'): void {
  db.update('activityLogs', (logs) => [
    {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      adminEmail,
      ip,
    },
    ...logs,
  ]);
}
