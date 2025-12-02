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
 * POST /api/marketing/classes/[id]/students
 * Add a student to a marketing class
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

    // Get current student_ids
    const classItem = await queryOne<{ student_ids: string | object | null }>(
      `SELECT student_ids FROM marketing_classes WHERE id = ?`,
      [id]
    );

    if (!classItem) {
      return NextResponse.json(
        { error: 'Marketing class not found' },
        { status: 404 }
      );
    }

    // Parse existing student_ids
    let studentIds: string[] = [];
    if (classItem.student_ids) {
      if (Array.isArray(classItem.student_ids)) {
        studentIds = classItem.student_ids;
      } else if (typeof classItem.student_ids === 'string') {
        try {
          studentIds = JSON.parse(classItem.student_ids);
        } catch {
          studentIds = [];
        }
      } else if (typeof classItem.student_ids === 'object') {
        studentIds = Object.values(classItem.student_ids) as string[];
      }
    }

    // Add student if not already in list
    if (!studentIds.includes(studentId)) {
      studentIds.push(studentId);
      const pool = getPool();

      await pool.execute(
        `UPDATE marketing_classes
         SET student_ids = ?
         WHERE id = ?`,
        [JSON.stringify(studentIds), id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student added successfully',
    });
  } catch (error) {
    console.error('Add student to marketing class error:', error);
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
 * DELETE /api/marketing/classes/[id]/students
 * Remove a student from a marketing class
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

    // Get current student_ids
    const classItem = await queryOne<{ student_ids: string | object | null }>(
      `SELECT student_ids FROM marketing_classes WHERE id = ?`,
      [id]
    );

    if (!classItem) {
      return NextResponse.json(
        { error: 'Marketing class not found' },
        { status: 404 }
      );
    }

    // Parse existing student_ids
    let studentIds: string[] = [];
    if (classItem.student_ids) {
      if (Array.isArray(classItem.student_ids)) {
        studentIds = classItem.student_ids;
      } else if (typeof classItem.student_ids === 'string') {
        try {
          studentIds = JSON.parse(classItem.student_ids);
        } catch {
          studentIds = [];
        }
      } else if (typeof classItem.student_ids === 'object') {
        studentIds = Object.values(classItem.student_ids) as string[];
      }
    }

    // Remove student
    studentIds = studentIds.filter((sid) => sid !== studentId);
    const pool = getPool();

    await pool.execute(
      `UPDATE marketing_classes
       SET student_ids = ?
       WHERE id = ?`,
      [JSON.stringify(studentIds), id]
    );

    return NextResponse.json({
      success: true,
      message: 'Student removed successfully',
    });
  } catch (error) {
    console.error('Remove student from marketing class error:', error);
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

