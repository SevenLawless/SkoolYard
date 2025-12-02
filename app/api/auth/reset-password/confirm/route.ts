import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrfTokenFromRequest } from '@/lib/middleware/csrf';
import { resetPasswordWithToken, getPasswordResetToken } from '@/lib/auth/passwordReset';
import { validatePassword } from '@/lib/auth/passwordValidation';
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
 * POST /api/auth/reset-password/confirm
 * Confirm password reset with token
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
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password complexity
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Get token info for logging
    const resetToken = await getPasswordResetToken(token);
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Reset password
    const success = await resetPasswordWithToken(token, newPassword);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Log successful reset
    await logAuditEvent({
      action: 'password_reset_success',
      userId: resetToken.userId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

