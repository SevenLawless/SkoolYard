import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, query, getPool } from '@/lib/db/connection';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit/logger';
import { randomBytes } from 'crypto';

// Initialize database on module load
if (typeof window === 'undefined') {
  try {
    initDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

/**
 * GET /api/classrooms
 * Get all classrooms
 */
export async function GET() {
  try {
    initDatabase();

    // Verify authentication
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch all classrooms
    const classrooms = await query<{
      id: string;
      name: string;
    }>(
      `SELECT id, name
       FROM classrooms
       ORDER BY name ASC`,
      []
    );

    return NextResponse.json({
      success: true,
      classrooms: classrooms.map((c) => ({
        id: c.id,
        name: c.name,
      })),
    });
  } catch (error) {
    console.error('Get classrooms error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classrooms
 * Create a new classroom
 */
export async function POST(request: NextRequest) {
  try {
    initDatabase();

    // Verify authentication
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate classroom ID
    const classroomId = `rm-${randomBytes(8).toString('hex')}`;

    const pool = getPool();

    // Insert classroom
    await pool.execute(
      `INSERT INTO classrooms 
       (id, name, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [classroomId, name]
    );

    // Log the creation
    await logAuditEvent({
      action: 'user_create',
      userId: payload.userId,
      resourceType: 'classroom',
      resourceId: classroomId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { name },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      classroom: {
        id: classroomId,
        name,
      },
    });
  } catch (error) {
    console.error('Create classroom error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

