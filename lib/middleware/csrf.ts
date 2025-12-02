import { randomBytes, createHmac } from 'crypto';
import { cookies } from 'next/headers';

const CSRF_SECRET = process.env.CSRF_SECRET || 'change-me-in-production-csrf';
const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a signed CSRF token
 */
export function signCsrfToken(token: string): string {
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(token);
  return `${token}.${hmac.digest('hex')}`;
}

/**
 * Verify a signed CSRF token
 */
export function verifyCsrfToken(signedToken: string): boolean {
  const parts = signedToken.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [token, signature] = parts;
  const expectedSignature = createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex');

  // Use timing-safe comparison
  return timingSafeEqual(signature, expectedSignature);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Get or create CSRF token for the current session
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_TOKEN_NAME);

  if (existingToken?.value) {
    return existingToken.value;
  }

  // Generate new token
  const token = generateCsrfToken();
  const signedToken = signCsrfToken(token);

  cookieStore.set(CSRF_TOKEN_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return signedToken;
}

/**
 * Verify CSRF token from request
 */
export async function verifyCsrfTokenFromRequest(
  request: Request
): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Verify both tokens match and are valid
  if (cookieToken !== headerToken) {
    return false;
  }

  return verifyCsrfToken(cookieToken);
}

/**
 * Extract CSRF token from request headers
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

