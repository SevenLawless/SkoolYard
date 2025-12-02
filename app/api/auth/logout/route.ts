import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/auth/session';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit/logger';
import { initDatabase } from '@/lib/db/connection';

// Initialize database on module load
if (typeof window === 'undefined') {
  try {
    initDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

/**
 * POST /api/auth/logout
 * Destroy session and clear cookies
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (sessionId) {
      await deleteSession(sessionId);
      
      // Get user ID from access token if available for audit log
      const accessToken = cookieStore.get('access_token')?.value;
      let userId: string | undefined;
      
      if (accessToken) {
        try {
          // Decode without verification to get user ID for logging
          const payload = JSON.parse(
            Buffer.from(accessToken.split('.')[1], 'base64').toString()
          );
          userId = payload.userId;
        } catch {
          // Ignore decode errors
        }
      }

      await logAuditEvent({
        action: 'logout',
        userId,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        status: 'success',
      });
    }

    // Clear cookies
    cookieStore.delete('access_token');
    cookieStore.delete('session_id');
    cookieStore.delete('csrf-token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

