import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, generateTokenPair } from '@/lib/auth/jwt';
import { getSession, updateSessionRefreshToken } from '@/lib/auth/session';
import { initDatabase, queryOne } from '@/lib/db/connection';

// Initialize database on module load
if (typeof window === 'undefined') {
  try {
    initDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Get session by session ID
    const sessionById = await getSession(sessionId);

    if (!sessionById) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const refreshPayload = verifyRefreshToken(sessionById.refreshToken);
    if (!refreshPayload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Get user data
    const user = await queryOne<{
      id: string;
      username: string;
      role: 'admin' | 'staff' | 'parent';
    }>(
      'SELECT id, username, role FROM users WHERE id = ?',
      [refreshPayload.userId]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new token pair
    const tokenPair = generateTokenPair({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Update session with new refresh token
    await updateSessionRefreshToken(sessionById.id, tokenPair.refreshToken);

    // Set new cookies
    cookieStore.set('access_token', tokenPair.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

