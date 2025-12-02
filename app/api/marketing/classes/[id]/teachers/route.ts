import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, queryOne, getPool } from '@/lib/db/connection';
import { verifyAccessToken } from '@/lib/auth/jwt';
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
 * POST /api/marketing/classes/[id]/teachers
 * Add a teacher to a marketing class
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
    const { teacherId } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Get current teacher_ids
    const classItem = await queryOne<{ teacher_ids: string | object | null }>(
      `SELECT teacher_ids FROM marketing_classes WHERE id = ?`,
      [id]
    );

    if (!classItem) {
      return NextResponse.json(
        { error: 'Marketing class not found' },
        { status: 404 }
      );
    }

    // Parse existing teacher_ids
    let teacherIds: string[] = [];
    if (classItem.teacher_ids) {
      if (Array.isArray(classItem.teacher_ids)) {
        teacherIds = classItem.teacher_ids;
      } else if (typeof classItem.teacher_ids === 'string') {
        try {
          teacherIds = JSON.parse(classItem.teacher_ids);
        } catch {
          teacherIds = [];
        }
      } else if (typeof classItem.teacher_ids === 'object') {
        teacherIds = Object.values(classItem.teacher_ids) as string[];
      }
    }

    // Add teacher if not already in list
    if (!teacherIds.includes(teacherId)) {
      teacherIds.push(teacherId);
      const pool = getPool();

      await pool.execute(
        `UPDATE marketing_classes
         SET teacher_ids = ?
         WHERE id = ?`,
        [JSON.stringify(teacherIds), id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher added successfully',
    });
  } catch (error) {
    console.error('Add teacher to marketing class error:', error);
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
 * DELETE /api/marketing/classes/[id]/teachers
 * Remove a teacher from a marketing class
 */
export async function DELETE(
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

    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Get current teacher_ids
    const classItem = await queryOne<{ teacher_ids: string | object | null }>(
      `SELECT teacher_ids FROM marketing_classes WHERE id = ?`,
      [id]
    );

    if (!classItem) {
      return NextResponse.json(
        { error: 'Marketing class not found' },
        { status: 404 }
      );
    }

    // Parse existing teacher_ids
    let teacherIds: string[] = [];
    if (classItem.teacher_ids) {
      if (Array.isArray(classItem.teacher_ids)) {
        teacherIds = classItem.teacher_ids;
      } else if (typeof classItem.teacher_ids === 'string') {
        try {
          teacherIds = JSON.parse(classItem.teacher_ids);
        } catch {
          teacherIds = [];
        }
      } else if (typeof classItem.teacher_ids === 'object') {
        teacherIds = Object.values(classItem.teacher_ids) as string[];
      }
    }

    // Remove teacher
    teacherIds = teacherIds.filter((tid) => tid !== teacherId);
    const pool = getPool();

    await pool.execute(
      `UPDATE marketing_classes
       SET teacher_ids = ?
       WHERE id = ?`,
      [JSON.stringify(teacherIds), id]
    );

    return NextResponse.json({
      success: true,
      message: 'Teacher removed successfully',
    });
  } catch (error) {
    console.error('Remove teacher from marketing class error:', error);
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

