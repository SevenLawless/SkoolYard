import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, queryOne, getPool } from '@/lib/db/connection';
import { verifyAccessToken } from '@/lib/auth/jwt';

// Initialize database on module load
if (typeof window === 'undefined') {
  try {
    initDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

/**
 * PUT /api/staff/[id]/tasks/[taskId]
 * Update a staff task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    initDatabase();
    const { id, taskId } = await params;

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

    // Verify task belongs to staff
    const task = await queryOne<{ staff_id: string }>(
      `SELECT staff_id FROM staff_tasks WHERE id = ?`,
      [taskId]
    );

    if (!task || task.staff_id !== id) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, dueDate, completed } = body;

    const pool = getPool();

    await pool.execute(
      `UPDATE staff_tasks
       SET title = ?, description = ?, due_date = ?, completed = ?
       WHERE id = ?`,
      [
        title,
        description || null,
        dueDate || null,
        completed || false,
        taskId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Update staff task error:', error);
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
 * DELETE /api/staff/[id]/tasks/[taskId]
 * Delete a staff task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    initDatabase();
    const { id, taskId } = await params;

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

    // Verify task belongs to staff
    const task = await queryOne<{ staff_id: string }>(
      `SELECT staff_id FROM staff_tasks WHERE id = ?`,
      [taskId]
    );

    if (!task || task.staff_id !== id) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const pool = getPool();

    await pool.execute(
      `DELETE FROM staff_tasks WHERE id = ?`,
      [taskId]
    );

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff task error:', error);
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

