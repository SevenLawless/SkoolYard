import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, queryOne, getPool } from '@/lib/db/connection';
import { verifyAccessToken } from '@/lib/auth/jwt';

// Initialize database on module load
if (typeof window === 'undefined') {
  try {
    initDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

/**
 * POST /api/classes/[id]/students
 * Enroll a student in a class
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
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Verify class exists
    const classItem = await queryOne<{ id: string }>(
      `SELECT id FROM classes WHERE id = ?`,
      [id]
    );

    if (!classItem) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    const pool = getPool();

    // Check if already enrolled
    const existing = await queryOne<{ student_id: string }>(
      `SELECT student_id FROM student_classes WHERE student_id = ? AND class_id = ?`,
      [studentId, id]
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Student already enrolled in this class' },
        { status: 409 }
      );
    }

    // Enroll student
    await pool.execute(
      `INSERT INTO student_classes (student_id, class_id, created_at)
       VALUES (?, ?, NOW())`,
      [studentId, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Student enrolled successfully',
    });
  } catch (error) {
    console.error('Enroll student error:', error);
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
 * DELETE /api/classes/[id]/students
 * Unenroll a student from a class
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
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Unenroll student
    await pool.execute(
      `DELETE FROM student_classes WHERE student_id = ? AND class_id = ?`,
      [studentId, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Student unenrolled successfully',
    });
  } catch (error) {
    console.error('Unenroll student error:', error);
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

