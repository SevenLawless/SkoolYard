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
 * GET /api/staff/[id]/attendance
 * Get all attendance records for a staff member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDatabase();
    const { id } = await params;

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

    // Fetch attendance records
    const records = await query<{
      date: string;
      status: 'present' | 'absent' | 'excused';
    }>(
      `SELECT date, status
       FROM attendance_records
       WHERE entity_type = 'staff' AND entity_id = ?
       ORDER BY date DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      attendance: records.map((r) => ({
        date: r.date,
        status: r.status,
      })),
    });
  } catch (error) {
    console.error('Get staff attendance error:', error);
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
 * POST /api/staff/[id]/attendance
 * Create or update an attendance record for a staff member
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDatabase();
    const { id } = await params;

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
    const { date, status } = body;

    if (!date || !status) {
      return NextResponse.json(
        { error: 'Date and status are required' },
        { status: 400 }
      );
    }

    if (!['present', 'absent', 'excused'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const recordId = `att-${randomBytes(8).toString('hex')}`;
    const pool = getPool();

    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle duplicates
    await pool.execute(
      `INSERT INTO attendance_records 
       (id, entity_type, entity_id, date, status, created_at)
       VALUES (?, 'staff', ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       status = VALUES(status)`,
      [recordId, id, date, status]
    );

    return NextResponse.json({
      success: true,
      attendance: {
        date,
        status,
      },
    });
  } catch (error) {
    console.error('Create staff attendance error:', error);
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

