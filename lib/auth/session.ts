import { getPool } from '@/lib/db/connection';
import { randomBytes } from 'crypto';
import type { TokenPair } from './jwt';

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  refreshToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const pool = getPool();
  const sessionId = randomBytes(16).toString('hex');
  
  // Refresh token expires in 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await pool.execute(
    `INSERT INTO sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [sessionId, userId, refreshToken, ipAddress || null, userAgent || null, expiresAt]
  );
  
  return sessionId;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, user_id as userId, refresh_token as refreshToken, ip_address as ipAddress, 
            user_agent as userAgent, expires_at as expiresAt, created_at as createdAt
     FROM sessions WHERE id = ? AND expires_at > NOW()`,
    [sessionId]
  );
  
  const sessions = rows as Session[];
  return sessions.length > 0 ? sessions[0] : null;
}

/**
 * Get session by refresh token
 */
export async function getSessionByRefreshToken(
  refreshToken: string
): Promise<Session | null> {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, user_id as userId, refresh_token as refreshToken, ip_address as ipAddress, 
            user_agent as userAgent, expires_at as expiresAt, created_at as createdAt
     FROM sessions WHERE refresh_token = ? AND expires_at > NOW()`,
    [refreshToken]
  );
  
  const sessions = rows as Session[];
  return sessions.length > 0 ? sessions[0] : null;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const pool = getPool();
  await pool.execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

/**
 * Delete all sessions for a user
 */
export async function deleteUserSessions(userId: string): Promise<void> {
  const pool = getPool();
  await pool.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
}

/**
 * Delete expired sessions (cleanup)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute(
    'DELETE FROM sessions WHERE expires_at < NOW()'
  );
  
  const deleteResult = result as any;
  return deleteResult.affectedRows || 0;
}

/**
 * Update session refresh token
 */
export async function updateSessionRefreshToken(
  sessionId: string,
  newRefreshToken: string
): Promise<void> {
  const pool = getPool();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await pool.execute(
    'UPDATE sessions SET refresh_token = ?, expires_at = ? WHERE id = ?',
    [newRefreshToken, expiresAt, sessionId]
  );
}

