import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, queryOne, query, getPool } from '@/lib/db/connection';
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
 * GET /api/teachers/[id]
 * Get a single teacher by ID
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

    // Fetch teacher
    const teacher = await queryOne<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      qualifications: string | null;
      subjects: string | object | null;
      salary: number;
      has_discount: boolean;
      discount_percentage: number | null;
    }>(
      `SELECT id, name, email, phone, qualifications, subjects, salary, has_discount, discount_percentage
       FROM teachers
       WHERE id = ?`,
      [id]
    );

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Fetch classes
    const teacherClasses = await query<{ id: string }>(
      `SELECT id FROM classes WHERE teacher_id = ?`,
      [id]
    );

    // Fetch attendance
    const attendanceRecords = await query<{
      date: string;
      status: 'present' | 'absent' | 'excused';
    }>(
      `SELECT date, status
       FROM attendance_records
       WHERE entity_type = 'teacher' AND entity_id = ?
       ORDER BY date DESC`,
      [id]
    );

    // Parse subjects
    let subjects: string[] = [];
    if (teacher.subjects) {
      if (Array.isArray(teacher.subjects)) {
        subjects = teacher.subjects;
      } else if (typeof teacher.subjects === 'string') {
        try {
          subjects = JSON.parse(teacher.subjects);
        } catch {
          subjects = [];
        }
      } else if (typeof teacher.subjects === 'object') {
        subjects = Object.values(teacher.subjects) as string[];
      }
    }

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone || '',
        qualifications: teacher.qualifications || '',
        subjects,
        salary: teacher.salary,
        classes: teacherClasses.map((c) => c.id),
        hasDiscount: teacher.has_discount,
        discountPercentage: teacher.discount_percentage || undefined,
        attendance: attendanceRecords.map((att) => ({
          date: att.date,
          status: att.status,
        })),
      },
    });
  } catch (error) {
    console.error('Get teacher error:', error);
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
 * PUT /api/teachers/[id]
 * Update a teacher
 */
export async function PUT(
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
    const { name, email, phone, qualifications, subjects, salary, hasDiscount, discountPercentage } = body;

    const pool = getPool();

    // Prepare subjects as JSON
    const subjectsJson = subjects && Array.isArray(subjects) ? JSON.stringify(subjects) : null;

    // Update teacher
    await pool.execute(
      `UPDATE teachers
       SET name = ?, email = ?, phone = ?, qualifications = ?, subjects = ?, 
           salary = ?, has_discount = ?, discount_percentage = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        email,
        phone || null,
        qualifications || null,
        subjectsJson,
        salary || 0,
        hasDiscount || false,
        discountPercentage || null,
        id,
      ]
    );

    // Log the update
    await logAuditEvent({
      action: 'user_update',
      userId: payload.userId,
      resourceType: 'teacher',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { name, email },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully',
    });
  } catch (error) {
    console.error('Update teacher error:', error);
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
 * DELETE /api/teachers/[id]
 * Delete a teacher
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

    const pool = getPool();

    // Delete teacher (cascade will handle related records)
    await pool.execute(
      `DELETE FROM teachers WHERE id = ?`,
      [id]
    );

    // Log the deletion
    await logAuditEvent({
      action: 'user_delete',
      userId: payload.userId,
      resourceType: 'teacher',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: {},
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
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

