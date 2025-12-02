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
 * GET /api/classes/[id]
 * Get a single class by ID
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

    // Fetch class
    const classItem = await queryOne<{
      id: string;
      subject: string;
      teacher_id: string | null;
      schedule: string | object | null;
      days_of_week: string | object | null;
      time: string | null;
      fees: number;
      social_media_active: boolean;
      provides_certification: boolean;
      classroom_id: string | null;
    }>(
      `SELECT id, subject, teacher_id, schedule, days_of_week, time, fees, 
              social_media_active, provides_certification, classroom_id
       FROM classes
       WHERE id = ?`,
      [id]
    );

    if (!classItem) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Fetch students
    const studentClasses = await query<{ student_id: string }>(
      `SELECT student_id FROM student_classes WHERE class_id = ?`,
      [id]
    );

    // Fetch ad expenses
    const adExpenses = await query<{
      id: string;
      date: string;
      amount: number;
      platform: string | null;
      description: string | null;
    }>(
      `SELECT id, date, amount, platform, description
       FROM class_ad_expenses
       WHERE class_id = ?
       ORDER BY date DESC`,
      [id]
    );

    // Parse schedule
    let schedule: { date: string; time: string }[] = [];
    if (classItem.schedule) {
      if (Array.isArray(classItem.schedule)) {
        schedule = classItem.schedule as { date: string; time: string }[];
      } else if (typeof classItem.schedule === 'string') {
        try {
          schedule = JSON.parse(classItem.schedule);
        } catch {
          schedule = [];
        }
      } else if (typeof classItem.schedule === 'object') {
        schedule = Object.values(classItem.schedule) as { date: string; time: string }[];
      }
    }

    // Parse days_of_week
    let daysOfWeek: number[] | undefined = undefined;
    if (classItem.days_of_week) {
      if (Array.isArray(classItem.days_of_week)) {
        daysOfWeek = classItem.days_of_week as number[];
      } else if (typeof classItem.days_of_week === 'string') {
        try {
          daysOfWeek = JSON.parse(classItem.days_of_week);
        } catch {
          daysOfWeek = undefined;
        }
      } else if (typeof classItem.days_of_week === 'object') {
        daysOfWeek = Object.values(classItem.days_of_week) as number[];
      }
    }

    return NextResponse.json({
      success: true,
      class: {
        id: classItem.id,
        subject: classItem.subject,
        teacherId: classItem.teacher_id || '',
        studentIds: studentClasses.map((sc) => sc.student_id),
        schedule,
        daysOfWeek,
        time: classItem.time || undefined,
        fees: classItem.fees,
        socialMediaActive: classItem.social_media_active,
        providesCertification: classItem.provides_certification,
        adExpenses: adExpenses.map((exp) => ({
          id: exp.id,
          date: exp.date,
          amount: exp.amount,
          platform: exp.platform || '',
          description: exp.description || undefined,
        })),
        classroomId: classItem.classroom_id || undefined,
      },
    });
  } catch (error) {
    console.error('Get class error:', error);
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
 * PUT /api/classes/[id]
 * Update a class
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
    const { subject, teacherId, studentIds, schedule, daysOfWeek, time, fees, socialMediaActive, providesCertification, classroomId } = body;

    const pool = getPool();

    // Prepare JSON fields
    const scheduleJson = schedule && Array.isArray(schedule) ? JSON.stringify(schedule) : null;
    const daysOfWeekJson = daysOfWeek && Array.isArray(daysOfWeek) ? JSON.stringify(daysOfWeek) : null;

    // Update class
    await pool.execute(
      `UPDATE classes
       SET subject = ?, teacher_id = ?, schedule = ?, days_of_week = ?, time = ?, 
           fees = ?, social_media_active = ?, provides_certification = ?, 
           classroom_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        subject,
        teacherId || null,
        scheduleJson,
        daysOfWeekJson,
        time || null,
        fees,
        socialMediaActive || false,
        providesCertification || false,
        classroomId || null,
        id,
      ]
    );

    // Update student relationships if provided
    if (studentIds !== undefined) {
      // Remove all existing student relationships
      await pool.execute(
        `DELETE FROM student_classes WHERE class_id = ?`,
        [id]
      );

      // Add new student relationships
      if (Array.isArray(studentIds) && studentIds.length > 0) {
        for (const studentId of studentIds) {
          await pool.execute(
            `INSERT INTO student_classes (student_id, class_id, created_at)
             VALUES (?, ?, NOW())`,
            [studentId, id]
          );
        }
      }
    }

    // Log the update
    await logAuditEvent({
      action: 'user_update',
      userId: payload.userId,
      resourceType: 'class',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { subject },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Class updated successfully',
    });
  } catch (error) {
    console.error('Update class error:', error);
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
 * DELETE /api/classes/[id]
 * Delete a class
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

    // Delete class (cascade will handle related records)
    await pool.execute(
      `DELETE FROM classes WHERE id = ?`,
      [id]
    );

    // Log the deletion
    await logAuditEvent({
      action: 'user_delete',
      userId: payload.userId,
      resourceType: 'class',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: {},
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.error('Delete class error:', error);
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

