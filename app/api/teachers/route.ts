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
 * GET /api/teachers
 * Get all teachers
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

    // Fetch all teachers
    const teachers = await query<{
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
       ORDER BY name ASC`,
      []
    );

    // Fetch classes for each teacher
    const teacherClasses = await query<{
      id: string;
      teacher_id: string | null;
    }>(
      `SELECT id, teacher_id FROM classes WHERE teacher_id IS NOT NULL`,
      []
    );

    // Fetch attendance for each teacher
    const attendanceRecords = await query<{
      entity_id: string;
      date: string;
      status: 'present' | 'absent' | 'excused';
    }>(
      `SELECT entity_id, date, status
       FROM attendance_records
       WHERE entity_type = 'teacher'
       ORDER BY date DESC`,
      []
    );

    // Group classes and attendance by teacher
    const classesByTeacher = new Map<string, string[]>();
    const attendanceByTeacher = new Map<string, any[]>();

    teacherClasses.forEach((cls) => {
      if (cls.teacher_id) {
        if (!classesByTeacher.has(cls.teacher_id)) {
          classesByTeacher.set(cls.teacher_id, []);
        }
        classesByTeacher.get(cls.teacher_id)!.push(cls.id);
      }
    });

    attendanceRecords.forEach((att) => {
      if (!attendanceByTeacher.has(att.entity_id)) {
        attendanceByTeacher.set(att.entity_id, []);
      }
      attendanceByTeacher.get(att.entity_id)!.push({
        date: att.date,
        status: att.status,
      });
    });

    // Format teachers with nested data
    const formattedTeachers = teachers.map((t) => {
      let subjects: string[] = [];
      if (t.subjects) {
        if (Array.isArray(t.subjects)) {
          subjects = t.subjects;
        } else if (typeof t.subjects === 'string') {
          try {
            subjects = JSON.parse(t.subjects);
          } catch {
            subjects = [];
          }
        } else if (typeof t.subjects === 'object') {
          subjects = Object.values(t.subjects) as string[];
        }
      }

      return {
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone || '',
        qualifications: t.qualifications || '',
        subjects,
        salary: t.salary,
        classes: classesByTeacher.get(t.id) || [],
        hasDiscount: t.has_discount,
        discountPercentage: t.discount_percentage || undefined,
        attendance: attendanceByTeacher.get(t.id) || [],
      };
    });

    return NextResponse.json({
      success: true,
      teachers: formattedTeachers,
    });
  } catch (error) {
    console.error('Get teachers error:', error);
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
 * POST /api/teachers
 * Create a new teacher
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
    const { name, email, phone, qualifications, subjects, salary, hasDiscount, discountPercentage } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Generate teacher ID
    const teacherId = `tch-${randomBytes(8).toString('hex')}`;

    const pool = getPool();

    // Prepare subjects as JSON
    const subjectsJson = subjects && Array.isArray(subjects) ? JSON.stringify(subjects) : null;

    // Insert teacher
    await pool.execute(
      `INSERT INTO teachers 
       (id, name, email, phone, qualifications, subjects, salary, has_discount, discount_percentage, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        teacherId,
        name,
        email,
        phone || null,
        qualifications || null,
        subjectsJson,
        salary || 0,
        hasDiscount || false,
        discountPercentage || null,
      ]
    );

    // Log the creation
    await logAuditEvent({
      action: 'user_create',
      userId: payload.userId,
      resourceType: 'teacher',
      resourceId: teacherId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { name, email },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacherId,
        name,
        email,
        phone: phone || '',
        qualifications: qualifications || '',
        subjects: subjects || [],
        salary: salary || 0,
        classes: [],
        hasDiscount: hasDiscount || false,
        discountPercentage: discountPercentage || undefined,
        attendance: [],
      },
    });
  } catch (error) {
    console.error('Create teacher error:', error);
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

