import { NextResponse } from 'next/server';
import { getCsrfToken } from '@/lib/middleware/csrf';

/**
 * GET /api/auth/csrf
 * Get CSRF token for the current session
 */
export async function GET() {
  try {
    const token = await getCsrfToken();
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

