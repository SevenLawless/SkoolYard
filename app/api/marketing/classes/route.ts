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
 * GET /api/marketing/classes
 * Get all marketing classes
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

    // Fetch all marketing classes
    const classes = await query<{
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
       ORDER BY created_at DESC`,
      []
    );

    // Fetch expenses for each marketing class
    const expenses = await query<{
      id: string;
      marketing_class_id: string;
      date: string;
      amount: number;
      category: string;
      description: string | null;
      type: 'in' | 'out';
    }>(
      `SELECT id, marketing_class_id, date, amount, category, description, type
       FROM marketing_expenses
       ORDER BY date DESC`,
      []
    );

    // Group expenses by class
    const expensesByClass = new Map<string, any[]>();

    expenses.forEach((exp) => {
      if (!expensesByClass.has(exp.marketing_class_id)) {
        expensesByClass.set(exp.marketing_class_id, []);
      }
      expensesByClass.get(exp.marketing_class_id)!.push({
        id: exp.id,
        date: exp.date,
        amount: exp.amount,
        category: exp.category,
        description: exp.description || '',
        type: exp.type,
      });
    });

    // Format classes with nested data
    const formattedClasses = classes.map((c) => {
      // Parse teacher_ids
      let teacherIds: string[] = [];
      if (c.teacher_ids) {
        if (Array.isArray(c.teacher_ids)) {
          teacherIds = c.teacher_ids;
        } else if (typeof c.teacher_ids === 'string') {
          try {
            teacherIds = JSON.parse(c.teacher_ids);
          } catch {
            teacherIds = [];
          }
        } else if (typeof c.teacher_ids === 'object') {
          teacherIds = Object.values(c.teacher_ids) as string[];
        }
      }

      // Parse student_ids
      let studentIds: string[] = [];
      if (c.student_ids) {
        if (Array.isArray(c.student_ids)) {
          studentIds = c.student_ids;
        } else if (typeof c.student_ids === 'string') {
          try {
            studentIds = JSON.parse(c.student_ids);
          } catch {
            studentIds = [];
          }
        } else if (typeof c.student_ids === 'object') {
          studentIds = Object.values(c.student_ids) as string[];
        }
      }

      // Parse schedule
      let schedule: { date: string; time: string }[] = [];
      if (c.schedule) {
        if (Array.isArray(c.schedule)) {
          schedule = c.schedule as { date: string; time: string }[];
        } else if (typeof c.schedule === 'string') {
          try {
            schedule = JSON.parse(c.schedule);
          } catch {
            schedule = [];
          }
        } else if (typeof c.schedule === 'object') {
          schedule = Object.values(c.schedule) as { date: string; time: string }[];
        }
      }

      // Parse days_of_week
      let daysOfWeek: number[] | undefined = undefined;
      if (c.days_of_week) {
        if (Array.isArray(c.days_of_week)) {
          daysOfWeek = c.days_of_week as number[];
        } else if (typeof c.days_of_week === 'string') {
          try {
            daysOfWeek = JSON.parse(c.days_of_week);
          } catch {
            daysOfWeek = undefined;
          }
        } else if (typeof c.days_of_week === 'object') {
          daysOfWeek = Object.values(c.days_of_week) as number[];
        }
      }

      return {
        id: c.id,
        name: c.name,
        description: c.description || '',
        teacherIds,
        studentIds,
        fees: c.fees,
        profitSharingPercentage: c.profit_sharing_percentage,
        centerPercentage: c.center_percentage,
        schedule,
        daysOfWeek,
        time: c.time || undefined,
        expenses: expensesByClass.get(c.id) || [],
        createdAt: c.created_at,
        active: c.active,
      };
    });

    return NextResponse.json({
      success: true,
      classes: formattedClasses,
    });
  } catch (error) {
    console.error('Get marketing classes error:', error);
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
 * POST /api/marketing/classes
 * Create a new marketing class
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
    const { name, description, teacherIds, studentIds, fees, profitSharingPercentage, centerPercentage, schedule, daysOfWeek, time, active } = body;

    // Validation
    if (!name || fees === undefined) {
      return NextResponse.json(
        { error: 'Name and fees are required' },
        { status: 400 }
      );
    }

    // Generate class ID
    const classId = `mkt-${randomBytes(8).toString('hex')}`;

    const pool = getPool();

    // Prepare JSON fields
    const teacherIdsJson = teacherIds && Array.isArray(teacherIds) ? JSON.stringify(teacherIds) : null;
    const studentIdsJson = studentIds && Array.isArray(studentIds) ? JSON.stringify(studentIds) : null;
    const scheduleJson = schedule && Array.isArray(schedule) ? JSON.stringify(schedule) : null;
    const daysOfWeekJson = daysOfWeek && Array.isArray(daysOfWeek) ? JSON.stringify(daysOfWeek) : null;

    // Insert marketing class
    await pool.execute(
      `INSERT INTO marketing_classes 
       (id, name, description, teacher_ids, student_ids, fees, profit_sharing_percentage, 
        center_percentage, schedule, days_of_week, time, created_at, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        classId,
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
      ]
    );

    // Log the creation
    await logAuditEvent({
      action: 'user_create',
      userId: payload.userId,
      resourceType: 'marketing_class',
      resourceId: classId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { name },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      class: {
        id: classId,
        name,
        description: description || '',
        teacherIds: teacherIds || [],
        studentIds: studentIds || [],
        fees,
        profitSharingPercentage: profitSharingPercentage || 0,
        centerPercentage: centerPercentage || 0,
        schedule: schedule || [],
        daysOfWeek,
        time: time || undefined,
        expenses: [],
        createdAt: new Date().toISOString(),
        active: active !== undefined ? active : true,
      },
    });
  } catch (error) {
    console.error('Create marketing class error:', error);
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

