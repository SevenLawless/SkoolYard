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
 * GET /api/staff/[id]
 * Get a single staff member by ID
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

    // Fetch staff
    const staff = await queryOne<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      salary: number;
    }>(
      `SELECT id, name, email, phone, salary
       FROM staff
       WHERE id = ?`,
      [id]
    );

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Fetch tasks
    const staffTasks = await query<{
      id: string;
      title: string;
      description: string | null;
      due_date: string | null;
      completed: boolean;
    }>(
      `SELECT id, title, description, due_date, completed
       FROM staff_tasks
       WHERE staff_id = ?
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
       WHERE entity_type = 'staff' AND entity_id = ?
       ORDER BY date DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone || '',
        salary: staff.salary,
        tasks: staffTasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          dueDate: task.due_date || '',
          completed: task.completed,
        })),
        attendance: attendanceRecords.map((att) => ({
          date: att.date,
          status: att.status,
        })),
      },
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
 * PUT /api/staff/[id]
 * Update a staff member
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
    const { name, email, phone, salary } = body;

    const pool = getPool();

    // Update staff
    await pool.execute(
      `UPDATE staff
       SET name = ?, email = ?, phone = ?, salary = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        email,
        phone || null,
        salary || 0,
        id,
      ]
    );

    // Log the update
    await logAuditEvent({
      action: 'user_update',
      userId: payload.userId,
      resourceType: 'staff',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { name, email },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully',
    });
  } catch (error) {
    console.error('Update staff error:', error);
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
 * DELETE /api/staff/[id]
 * Delete a staff member
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

    // Delete staff (cascade will handle related records)
    await pool.execute(
      `DELETE FROM staff WHERE id = ?`,
      [id]
    );

    // Log the deletion
    await logAuditEvent({
      action: 'user_delete',
      userId: payload.userId,
      resourceType: 'staff',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: {},
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff error:', error);
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

