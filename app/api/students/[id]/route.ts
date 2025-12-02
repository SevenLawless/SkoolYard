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
 * GET /api/students/[id]
 * Get a single student by ID
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

    // Fetch student
    const student = await queryOne<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      address: string | null;
      dob: string | null;
      has_discount: boolean;
      discount_percentage: number | null;
    }>(
      `SELECT id, name, email, phone, address, dob, has_discount, discount_percentage
       FROM students
       WHERE id = ?`,
      [id]
    );

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Fetch classes
    const studentClasses = await query<{ class_id: string }>(
      `SELECT class_id FROM student_classes WHERE student_id = ?`,
      [id]
    );

    // Fetch tasks
    const studentTasks = await query<{
      id: string;
      title: string;
      description: string | null;
      due_date: string | null;
      completed: boolean;
      assigned_by: string | null;
    }>(
      `SELECT id, title, description, due_date, completed, assigned_by
       FROM student_tasks
       WHERE student_id = ?
       ORDER BY due_date ASC`,
      [id]
    );

    // Fetch attendance
    const attendanceRecords = await query<{
      date: string;
      status: 'present' | 'absent' | 'excused';
    }>(
      `SELECT date, status
       FROM attendance_records
       WHERE entity_type = 'student' AND entity_id = ?
       ORDER BY date DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone || '',
        address: student.address || '',
        dob: student.dob || '',
        classes: studentClasses.map((sc) => sc.class_id),
        hasDiscount: student.has_discount,
        discountPercentage: student.discount_percentage || undefined,
        tasks: studentTasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          dueDate: task.due_date || '',
          completed: task.completed,
          assignedBy: task.assigned_by || undefined,
        })),
        attendance: attendanceRecords.map((att) => ({
          date: att.date,
          status: att.status,
        })),
      },
    });
  } catch (error) {
    console.error('Get student error:', error);
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
 * PUT /api/students/[id]
 * Update a student
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
    const { name, email, phone, address, dob, hasDiscount, discountPercentage, classes } = body;

    const pool = getPool();

    // Update student
    await pool.execute(
      `UPDATE students
       SET name = ?, email = ?, phone = ?, address = ?, dob = ?, 
           has_discount = ?, discount_percentage = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        email,
        phone || null,
        address || null,
        dob || null,
        hasDiscount || false,
        discountPercentage || null,
        id,
      ]
    );

    // Update class relationships if provided
    if (classes !== undefined) {
      // Remove all existing class relationships
      await pool.execute(
        `DELETE FROM student_classes WHERE student_id = ?`,
        [id]
      );

      // Add new class relationships
      if (Array.isArray(classes) && classes.length > 0) {
        for (const classId of classes) {
          await pool.execute(
            `INSERT INTO student_classes (student_id, class_id, created_at)
             VALUES (?, ?, NOW())`,
            [id, classId]
          );
        }
      }
    }

    // Log the update
    await logAuditEvent({
      action: 'user_update',
      userId: payload.userId,
      resourceType: 'student',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { name, email },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
    });
  } catch (error) {
    console.error('Update student error:', error);
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
 * DELETE /api/students/[id]
 * Delete a student
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

    // Delete student (cascade will handle related records)
    await pool.execute(
      `DELETE FROM students WHERE id = ?`,
      [id]
    );

    // Log the deletion
    await logAuditEvent({
      action: 'user_delete',
      userId: payload.userId,
      resourceType: 'student',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: {},
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
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

