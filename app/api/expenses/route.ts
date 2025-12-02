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
 * GET /api/expenses
 * Get all custom expenses
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

    // Fetch all custom expenses
    const expenses = await query<{
      id: string;
      date: string;
      amount: number;
      category: string;
      description: string | null;
      type: 'monthly' | 'one-time';
    }>(
      `SELECT id, date, amount, category, description, type
       FROM custom_expenses
       ORDER BY date DESC`,
      []
    );

    return NextResponse.json({
      success: true,
      expenses: expenses.map((e) => ({
        id: e.id,
        date: e.date,
        amount: e.amount,
        category: e.category,
        description: e.description || '',
        type: e.type,
      })),
    });
  } catch (error) {
    console.error('Get expenses error:', error);
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
 * POST /api/expenses
 * Create a new custom expense
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
    const { date, amount, category, description, type } = body;

    // Validation
    if (!date || amount === undefined || !category || !type) {
      return NextResponse.json(
        { error: 'Date, amount, category, and type are required' },
        { status: 400 }
      );
    }

    if (!['monthly', 'one-time'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    // Generate expense ID
    const expenseId = `exp-${randomBytes(8).toString('hex')}`;

    const pool = getPool();

    // Insert expense
    await pool.execute(
      `INSERT INTO custom_expenses 
       (id, date, amount, category, description, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        expenseId,
        date,
        amount,
        category,
        description || null,
        type,
      ]
    );

    // Log the creation
    await logAuditEvent({
      action: 'user_create',
      userId: payload.userId,
      resourceType: 'custom_expense',
      resourceId: expenseId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { category, amount, type },
      status: 'success',
    });

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
    console.error('Create expense error:', error);
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

