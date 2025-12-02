import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getSession } from '@/lib/auth/session';
import { initDatabase, queryOne } from '@/lib/db/connection';
import { cleanupExpiredSessions } from '@/lib/auth/session';

// Initialize database on module load
if (typeof window === 'undefined') {
  try {
    initDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

/**
 * GET /api/auth/verify
 * Verify current session and return user data
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const sessionId = cookieStore.get('session_id')?.value;

    if (!accessToken || !sessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify access token
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify session exists
    const session = await getSession(sessionId);
    if (!session || session.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Clean up expired sessions periodically
    if (Math.random() < 0.1) {
      // 10% chance to run cleanup
      await cleanupExpiredSessions();
    }

    // Get user data
    const user = await queryOne<{
      id: string;
      username: string;
      role: 'admin' | 'staff' | 'parent';
      name: string;
      email: string;
      phone: string | null;
      staff_id: string | null;
      permissions: string | null;
      student_ids: string | null;
    }>(
      `SELECT id, username, role, name, email, phone, staff_id, permissions, student_ids
       FROM users WHERE id = ?`,
      [payload.userId]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse permissions and student_ids from JSON
    let permissions = null;
    let studentIds = null;
    try {
      permissions = user.permissions ? JSON.parse(user.permissions) : null;
      studentIds = user.student_ids ? JSON.parse(user.student_ids) : null;
    } catch {
      // Invalid JSON, keep as null
    }

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
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

