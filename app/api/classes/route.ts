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
 * GET /api/classes
 * Get all classes
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

    // Fetch all classes
    const classes = await query<{
      id: string;
      subject: string;
      teacher_id: string | null;
      student_ids: string | object | null;
      schedule: string | object | null;
      days_of_week: string | object | null;
      time: string | null;
      fees: number;
      social_media_active: boolean;
      provides_certification: boolean;
      classroom_id: string | null;
    }>(
      `SELECT id, subject, teacher_id, student_ids, schedule, days_of_week, time, fees, 
              social_media_active, provides_certification, classroom_id
       FROM classes
       ORDER BY subject ASC`,
      []
    );

    // Fetch student-class relationships
    const studentClasses = await query<{
      student_id: string;
      class_id: string;
    }>(
      `SELECT student_id, class_id FROM student_classes`,
      []
    );

    // Fetch ad expenses for each class
    const adExpenses = await query<{
      id: string;
      class_id: string;
      date: string;
      amount: number;
      platform: string | null;
      description: string | null;
    }>(
      `SELECT id, class_id, date, amount, platform, description
       FROM class_ad_expenses
       ORDER BY date DESC`,
      []
    );

    // Group students and expenses by class
    const studentsByClass = new Map<string, string[]>();
    const expensesByClass = new Map<string, Array<{
      id: string;
      date: string;
      amount: number;
      platform: string;
      description?: string;
    }>>();

    studentClasses.forEach((sc) => {
      if (!studentsByClass.has(sc.class_id)) {
        studentsByClass.set(sc.class_id, []);
      }
      studentsByClass.get(sc.class_id)!.push(sc.student_id);
    });

    adExpenses.forEach((exp) => {
      if (!expensesByClass.has(exp.class_id)) {
        expensesByClass.set(exp.class_id, []);
      }
      expensesByClass.get(exp.class_id)!.push({
        id: exp.id,
        date: exp.date,
        amount: exp.amount,
        platform: exp.platform || '',
        description: exp.description || undefined,
      });
    });

    // Format classes with nested data
    const formattedClasses = classes.map((c) => {
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
        subject: c.subject,
        teacherId: c.teacher_id || '',
        studentIds: studentsByClass.get(c.id) || [],
        schedule,
        daysOfWeek,
        time: c.time || undefined,
        fees: c.fees,
        socialMediaActive: c.social_media_active,
        providesCertification: c.provides_certification,
        adExpenses: expensesByClass.get(c.id) || [],
        classroomId: c.classroom_id || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      classes: formattedClasses,
    });
  } catch (error) {
    console.error('Get classes error:', error);
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
 * POST /api/classes
 * Create a new class
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
    const { subject, teacherId, studentIds, schedule, daysOfWeek, time, fees, socialMediaActive, providesCertification, classroomId } = body;

    // Validation
    if (!subject || fees === undefined) {
      return NextResponse.json(
        { error: 'Subject and fees are required' },
        { status: 400 }
      );
    }

    // Generate class ID
    const classId = `cls-${randomBytes(8).toString('hex')}`;

    const pool = getPool();

    // Prepare JSON fields
    const scheduleJson = schedule && Array.isArray(schedule) ? JSON.stringify(schedule) : null;
    const daysOfWeekJson = daysOfWeek && Array.isArray(daysOfWeek) ? JSON.stringify(daysOfWeek) : null;

    // Insert class
    await pool.execute(
      `INSERT INTO classes 
       (id, subject, teacher_id, schedule, days_of_week, time, fees, 
        social_media_active, provides_certification, classroom_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        classId,
        subject,
        teacherId || null,
        scheduleJson,
        daysOfWeekJson,
        time || null,
        fees,
        socialMediaActive || false,
        providesCertification || false,
        classroomId || null,
      ]
    );

    // Insert student relationships if provided
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      for (const studentId of studentIds) {
        try {
          await pool.execute(
            `INSERT INTO student_classes (student_id, class_id, created_at)
             VALUES (?, ?, NOW())`,
            [studentId, classId]
          );
        } catch {
          // Ignore duplicate entries
          console.warn(`Student ${studentId} already enrolled in class ${classId}`);
        }
      }
    }

    // Log the creation
    await logAuditEvent({
      action: 'user_create',
      userId: payload.userId,
      resourceType: 'class',
      resourceId: classId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { subject },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      class: {
        id: classId,
        subject,
        teacherId: teacherId || '',
        studentIds: studentIds || [],
        schedule: schedule || [],
        daysOfWeek,
        time: time || undefined,
        fees,
        socialMediaActive: socialMediaActive || false,
        providesCertification: providesCertification || false,
        adExpenses: [],
        classroomId: classroomId || undefined,
      },
    });
  } catch (error) {
    console.error('Create class error:', error);
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

