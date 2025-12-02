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
 * GET /api/marketing/classes/[id]/expenses
 * Get all expenses for a marketing class
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

    return NextResponse.json({
      success: true,
      expenses: expenses.map((exp) => ({
        id: exp.id,
        date: exp.date,
        amount: exp.amount,
        category: exp.category,
        description: exp.description || '',
        type: exp.type,
      })),
    });
  } catch (error) {
    console.error('Get marketing expenses error:', error);
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
 * POST /api/marketing/classes/[id]/expenses
 * Create a new expense for a marketing class
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
    const { date, amount, category, description, type } = body;

    if (!date || amount === undefined || !category || !type) {
      return NextResponse.json(
        { error: 'Date, amount, category, and type are required' },
        { status: 400 }
      );
    }

    if (!['in', 'out'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    const expenseId = `exp-${randomBytes(8).toString('hex')}`;
    const pool = getPool();

    await pool.execute(
      `INSERT INTO marketing_expenses 
       (id, marketing_class_id, date, amount, category, description, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        expenseId,
        id,
        date,
        amount,
        category,
        description || null,
        type,
      ]
    );

    return NextResponse.json({
      success: true,
      expense: {
        id: expenseId,
        date,
        amount,
        category,
        description: description || '',
        type,
      },
    });
  } catch (error) {
    console.error('Create marketing expense error:', error);
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

