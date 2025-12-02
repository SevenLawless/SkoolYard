import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, queryOne } from '@/lib/db/connection';
import { verifyPassword } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { createSession } from '@/lib/auth/session';
import { rateLimit, createRateLimitResponse } from '@/lib/middleware/rateLimit';
import { verifyCsrfTokenFromRequest } from '@/lib/middleware/csrf';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit/logger';

// Initialize database on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    initDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.allowed) {
      await logAuditEvent({
        action: 'rate_limit_exceeded',
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        status: 'failure',
      });
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    // CSRF protection
    const csrfValid = await verifyCsrfTokenFromRequest(request);
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await queryOne<{
      id: string;
      username: string;
      password_hash: string;
      role: 'admin' | 'staff' | 'parent';
      name: string;
      email: string;
      phone: string | null;
      staff_id: string | null;
      permissions: string | null;
      student_ids: string | null;
    }>(
      `SELECT id, username, password_hash, role, name, email, phone, staff_id, permissions, student_ids
       FROM users WHERE username = ?`,
      [username]
    );

    if (!user) {
      await logAuditEvent({
        action: 'login_failure',
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        details: { username, reason: 'user_not_found' },
        status: 'failure',
      });

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      await logAuditEvent({
        action: 'login_failure',
        userId: user.id,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        details: { username, reason: 'invalid_password' },
        status: 'failure',
      });

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const tokenPair = generateTokenPair({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Create session
    const sessionId = await createSession(
      user.id,
      tokenPair.refreshToken,
      getClientIp(request),
      getUserAgent(request)
    );

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set('access_token', tokenPair.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    cookieStore.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Parse permissions and student_ids from JSON
    let permissions = null;
    let studentIds = null;
    try {
      permissions = user.permissions ? JSON.parse(user.permissions) : null;
      studentIds = user.student_ids ? JSON.parse(user.student_ids) : null;
    } catch {
      // Invalid JSON, keep as null
    }

    // Log successful login
    await logAuditEvent({
      action: 'login_success',
      userId: user.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { username },
      status: 'success',
    });

    // Return user data (without password)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        staffId: user.staff_id,
        permissions,
        studentIds,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

