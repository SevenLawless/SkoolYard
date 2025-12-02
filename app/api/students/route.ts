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
 * GET /api/students
 * Get all students
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

    // Fetch all students
    const students = await query<{
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
       ORDER BY name ASC`,
      []
    );

    // Fetch classes for each student
    const studentClasses = await query<{
      student_id: string;
      class_id: string;
    }>(
      `SELECT student_id, class_id FROM student_classes`,
      []
    );

    // Fetch tasks for each student
    const studentTasks = await query<{
      id: string;
      student_id: string;
      title: string;
      description: string | null;
      due_date: string | null;
      completed: boolean;
      assigned_by: string | null;
    }>(
      `SELECT id, student_id, title, description, due_date, completed, assigned_by
       FROM student_tasks
       ORDER BY due_date ASC`,
      []
    );

    // Fetch attendance for each student
    const attendanceRecords = await query<{
      id: string;
      entity_id: string;
      date: string;
      status: 'present' | 'absent' | 'excused';
    }>(
      `SELECT id, entity_id, date, status
       FROM attendance_records
       WHERE entity_type = 'student'
       ORDER BY date DESC`,
      []
    );

    // Group classes, tasks, and attendance by student
    const classesByStudent = new Map<string, string[]>();
    const tasksByStudent = new Map<string, Array<{
      id: string;
      title: string;
      description: string;
      dueDate: string;
      completed: boolean;
      assignedBy?: string;
    }>>();
    const attendanceByStudent = new Map<string, Array<{
      date: string;
      status: 'present' | 'absent' | 'excused';
    }>>();

    studentClasses.forEach((sc) => {
      if (!classesByStudent.has(sc.student_id)) {
        classesByStudent.set(sc.student_id, []);
      }
      classesByStudent.get(sc.student_id)!.push(sc.class_id);
    });

    studentTasks.forEach((task) => {
      if (!tasksByStudent.has(task.student_id)) {
        tasksByStudent.set(task.student_id, []);
      }
      tasksByStudent.get(task.student_id)!.push({
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.due_date || '',
        completed: task.completed,
        assignedBy: task.assigned_by || undefined,
      });
    });

    attendanceRecords.forEach((att) => {
      if (!attendanceByStudent.has(att.entity_id)) {
        attendanceByStudent.set(att.entity_id, []);
      }
      attendanceByStudent.get(att.entity_id)!.push({
        date: att.date,
        status: att.status,
      });
    });

    // Format students with nested data
    const formattedStudents = students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone || '',
      address: s.address || '',
      dob: s.dob || '',
      classes: classesByStudent.get(s.id) || [],
      hasDiscount: s.has_discount,
      discountPercentage: s.discount_percentage || undefined,
      tasks: tasksByStudent.get(s.id) || [],
      attendance: attendanceByStudent.get(s.id) || [],
    }));

    return NextResponse.json({
      success: true,
      students: formattedStudents,
    });
  } catch (error) {
    console.error('Get students error:', error);
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
 * POST /api/students
 * Create a new student
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
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check permissions (admin or staff with edit permission)
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, address, dob, hasDiscount, discountPercentage, classes } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Generate student ID
    const studentId = `stu-${randomBytes(8).toString('hex')}`;

    const pool = getPool();

    // Insert student
    await pool.execute(
      `INSERT INTO students 
       (id, name, email, phone, address, dob, has_discount, discount_percentage, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        studentId,
        name,
        email,
        phone || null,
        address || null,
        dob || null,
        hasDiscount || false,
        discountPercentage || null,
      ]
    );

    // Insert class relationships if provided
    if (classes && Array.isArray(classes) && classes.length > 0) {
      for (const classId of classes) {
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
      resourceType: 'student',
      resourceId: studentId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { name, email },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      student: {
        id: studentId,
        name,
        email,
        phone: phone || '',
        address: address || '',
        dob: dob || '',
        classes: classes || [],
        hasDiscount: hasDiscount || false,
        discountPercentage: discountPercentage || undefined,
        tasks: [],
        attendance: [],
      },
    });
  } catch (error) {
    console.error('Create student error:', error);
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

