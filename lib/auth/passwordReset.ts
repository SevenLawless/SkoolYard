import { getPool } from '@/lib/db/connection';
import { generateSecureToken } from './jwt';
import { hashPassword } from './password';
import { randomBytes } from 'crypto';

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

/**
 * Create a password reset token
 * Tokens expire after 1 hour
 */
export async function createPasswordResetToken(
  userId: string
): Promise<string> {
  const pool = getPool();
  const id = randomBytes(16).toString('hex');
  const token = generateSecureToken();
  
  // Token expires in 1 hour
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  
  await pool.execute(
    `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at)
     VALUES (?, ?, ?, ?, FALSE, NOW())`,
    [id, userId, token, expiresAt]
  );
  
  return token;
}

/**
 * Get password reset token by token string
 */
export async function getPasswordResetToken(
  token: string
): Promise<PasswordResetToken | null> {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, user_id as userId, token, expires_at as expiresAt, used, created_at as createdAt
     FROM password_reset_tokens
     WHERE token = ? AND expires_at > NOW() AND used = FALSE`,
    [token]
  );
  
  const tokens = rows as PasswordResetToken[];
  return tokens.length > 0 ? tokens[0] : null;
}

/**
 * Mark a password reset token as used
 */
export async function markTokenAsUsed(tokenId: string): Promise<void> {
  const pool = getPool();
  await pool.execute(
    'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
    [tokenId]
  );
}

/**
 * Reset password using a token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  const resetToken = await getPasswordResetToken(token);
  
  if (!resetToken) {
    return false;
  }
  
  // Hash the new password
  const passwordHash = await hashPassword(newPassword);
  
  // Update user password
  const pool = getPool();
  await pool.execute(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, resetToken.userId]
  );
  
  // Mark token as used
  await markTokenAsUsed(resetToken.id);
  
  return true;
}

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute(
    'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE'
  );
  
  const deleteResult = result as { affectedRows?: number };
  return deleteResult.affectedRows || 0;
}

