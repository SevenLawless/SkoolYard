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
 * GET /api/marketing/classes/[id]
 * Get a single marketing class by ID
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

    // Fetch marketing class
    const classItem = await queryOne<{
      id: string;
      name: string;
      description: string | null;
      teacher_ids: string | object | null;
      student_ids: string | object | null;
      fees: number;
      profit_sharing_percentage: number;
      center_percentage: number;
      schedule: string | object | null;
      days_of_week: string | object | null;
      time: string | null;
      created_at: string;
      active: boolean;
    }>(
      `SELECT id, name, description, teacher_ids, student_ids, fees, 
              profit_sharing_percentage, center_percentage, schedule, days_of_week, time, created_at, active
       FROM marketing_classes
       WHERE id = ?`,
      [id]
    );

    if (!classItem) {
      return NextResponse.json(
        { error: 'Marketing class not found' },
        { status: 404 }
      );
    }

    // Fetch expenses
    const expenses = await query<{
      id: string;
      date: string;
      amount: number;
      category: string;
      description: string | null;
      type: 'in' | 'out';
    }>(
      `SELECT id, date, amount, category, description, type
       FROM marketing_expenses
       WHERE marketing_class_id = ?
       ORDER BY date DESC`,
      [id]
    );

    // Parse JSON fields
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
        name: classItem.name,
        description: classItem.description || '',
        teacherIds,
        studentIds,
        fees: classItem.fees,
        profitSharingPercentage: classItem.profit_sharing_percentage,
        centerPercentage: classItem.center_percentage,
        schedule,
        daysOfWeek,
        time: classItem.time || undefined,
        expenses: expenses.map((exp) => ({
          id: exp.id,
          date: exp.date,
          amount: exp.amount,
          category: exp.category,
          description: exp.description || '',
          type: exp.type,
        })),
        createdAt: classItem.created_at,
        active: classItem.active,
      },
    });
  } catch (error) {
    console.error('Get marketing class error:', error);
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
 * PUT /api/marketing/classes/[id]
 * Update a marketing class
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
    const { name, description, teacherIds, studentIds, fees, profitSharingPercentage, centerPercentage, schedule, daysOfWeek, time, active } = body;

    const pool = getPool();

    // Prepare JSON fields
    const teacherIdsJson = teacherIds && Array.isArray(teacherIds) ? JSON.stringify(teacherIds) : null;
    const studentIdsJson = studentIds && Array.isArray(studentIds) ? JSON.stringify(studentIds) : null;
    const scheduleJson = schedule && Array.isArray(schedule) ? JSON.stringify(schedule) : null;
    const daysOfWeekJson = daysOfWeek && Array.isArray(daysOfWeek) ? JSON.stringify(daysOfWeek) : null;

    // Update marketing class
    await pool.execute(
      `UPDATE marketing_classes
       SET name = ?, description = ?, teacher_ids = ?, student_ids = ?, fees = ?, 
           profit_sharing_percentage = ?, center_percentage = ?, schedule = ?, 
           days_of_week = ?, time = ?, active = ?
       WHERE id = ?`,
      [
        name,
        description || null,
        teacherIdsJson,
        studentIdsJson,
        fees,
        profitSharingPercentage || 0,
        centerPercentage || 0,
        scheduleJson,
        daysOfWeekJson,
        time || null,
        active !== undefined ? active : true,
        id,
      ]
    );

    // Log the update
    await logAuditEvent({
      action: 'user_update',
      userId: payload.userId,
      resourceType: 'marketing_class',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { name },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Marketing class updated successfully',
    });
  } catch (error) {
    console.error('Update marketing class error:', error);
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
 * DELETE /api/marketing/classes/[id]
 * Delete a marketing class
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

    // Delete marketing class (cascade will handle related records)
    await pool.execute(
      `DELETE FROM marketing_classes WHERE id = ?`,
      [id]
    );

    // Log the deletion
    await logAuditEvent({
      action: 'user_delete',
      userId: payload.userId,
      resourceType: 'marketing_class',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: {},
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Marketing class deleted successfully',
    });
  } catch (error) {
    console.error('Delete marketing class error:', error);
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

