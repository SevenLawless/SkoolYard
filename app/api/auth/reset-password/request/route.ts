import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrfTokenFromRequest } from '@/lib/middleware/csrf';
import { initDatabase, queryOne } from '@/lib/db/connection';
import { createPasswordResetToken } from '@/lib/auth/passwordReset';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit/logger';

// Initialize database on module load
if (typeof window === 'undefined') {
  try {
    initDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

/**
 * POST /api/auth/reset-password/request
 * Request a password reset token (admin can generate for any user)
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const csrfValid = await verifyCsrfTokenFromRequest(request);
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, username } = body;

    if (!userId && !username) {
      return NextResponse.json(
        { error: 'User ID or username is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await queryOne<{ id: string; username: string; email: string }>(
      userId
        ? 'SELECT id, username, email FROM users WHERE id = ?'
        : 'SELECT id, username, email FROM users WHERE username = ?',
      userId ? [userId] : [username]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create reset token
    const token = await createPasswordResetToken(user.id);

    // Log the request
    await logAuditEvent({
      action: 'password_reset_request',
      userId: user.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { username: user.username },
      status: 'success',
    });

    // Return token (in production, this would be sent via email)
    return NextResponse.json({
      success: true,
      token, // In production, don't return token - send via email
      message: 'Password reset token generated. Use this token to reset your password.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

