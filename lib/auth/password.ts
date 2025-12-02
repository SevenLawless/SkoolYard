import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if a password needs rehashing (if salt rounds changed)
 */
export function needsRehash(hash: string): boolean {
  // Extract the cost factor from the hash
  const matches = hash.match(/^\$2[aby]\$(\d+)\$/);
  if (!matches) return false;
  
  const cost = parseInt(matches[1], 10);
  return cost < SALT_ROUNDS;
}

