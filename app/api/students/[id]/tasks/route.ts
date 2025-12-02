import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, query, getPool } from '@/lib/db/connection';
import { verifyAccessToken } from '@/lib/auth/jwt';
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
 * GET /api/students/[id]/tasks
 * Get all tasks for a student
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

    // Fetch tasks
    const tasks = await query<{
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

    return NextResponse.json({
      success: true,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.due_date || '',
        completed: task.completed,
        assignedBy: task.assigned_by || undefined,
      })),
    });
  } catch (error) {
    console.error('Get student tasks error:', error);
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
 * POST /api/students/[id]/tasks
 * Create a new task for a student
 */
export async function POST(
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
    const { title, description, dueDate, completed, assignedBy } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const taskId = `tsk-${randomBytes(8).toString('hex')}`;
    const pool = getPool();

    await pool.execute(
      `INSERT INTO student_tasks 
       (id, student_id, title, description, due_date, completed, assigned_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        taskId,
        id,
        title,
        description || null,
        dueDate || null,
        completed || false,
        assignedBy || null,
      ]
    );

    return NextResponse.json({
      success: true,
      task: {
        id: taskId,
        title,
        description: description || '',
        dueDate: dueDate || '',
        completed: completed || false,
        assignedBy: assignedBy || undefined,
      },
    });
  } catch (error) {
    console.error('Create student task error:', error);
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

