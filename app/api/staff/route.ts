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
 * GET /api/staff
 * Get all staff members
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

    // Fetch all staff
    const staff = await query<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      salary: number;
    }>(
      `SELECT id, name, email, phone, salary
       FROM staff
       ORDER BY name ASC`,
      []
    );

    // Fetch tasks for each staff member
    const staffTasks = await query<{
      id: string;
      staff_id: string;
      title: string;
      description: string | null;
      due_date: string | null;
      completed: boolean;
    }>(
      `SELECT id, staff_id, title, description, due_date, completed
       FROM staff_tasks
       ORDER BY due_date ASC`,
      []
    );

    // Fetch attendance for each staff member
    const attendanceRecords = await query<{
      entity_id: string;
      date: string;
      status: 'present' | 'absent' | 'excused';
    }>(
      `SELECT entity_id, date, status
       FROM attendance_records
       WHERE entity_type = 'staff'
       ORDER BY date DESC`,
      []
    );

    // Group tasks and attendance by staff
    const tasksByStaff = new Map<string, Array<{
      id: string;
      title: string;
      description: string;
      dueDate: string;
      completed: boolean;
    }>>();
    const attendanceByStaff = new Map<string, Array<{
      date: string;
      status: 'present' | 'absent' | 'excused';
    }>>();

    staffTasks.forEach((task) => {
      if (!tasksByStaff.has(task.staff_id)) {
        tasksByStaff.set(task.staff_id, []);
      }
      tasksByStaff.get(task.staff_id)!.push({
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.due_date || '',
        completed: task.completed,
      });
    });

    attendanceRecords.forEach((att) => {
      if (!attendanceByStaff.has(att.entity_id)) {
        attendanceByStaff.set(att.entity_id, []);
      }
      attendanceByStaff.get(att.entity_id)!.push({
        date: att.date,
        status: att.status,
      });
    });

    // Format staff with nested data
    const formattedStaff = staff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone || '',
      salary: s.salary,
      tasks: tasksByStaff.get(s.id) || [],
      attendance: attendanceByStaff.get(s.id) || [],
    }));

    return NextResponse.json({
      success: true,
      staff: formattedStaff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
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
 * POST /api/staff
 * Create a new staff member
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
    const { name, email, phone, salary } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Generate staff ID
    const staffId = `stf-${randomBytes(8).toString('hex')}`;

    const pool = getPool();

    // Insert staff
    await pool.execute(
      `INSERT INTO staff 
       (id, name, email, phone, salary, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        staffId,
        name,
        email,
        phone || null,
        salary || 0,
      ]
    );

    // Log the creation
    await logAuditEvent({
      action: 'user_create',
      userId: payload.userId,
      resourceType: 'staff',
      resourceId: staffId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { name, email },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      staff: {
        id: staffId,
        name,
        email,
        phone: phone || '',
        salary: salary || 0,
        tasks: [],
        attendance: [],
      },
    });
  } catch (error) {
    console.error('Create staff error:', error);
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

