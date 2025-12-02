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
 * GET /api/classes/[id]/expenses
 * Get all ad expenses for a class
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
      platform: string | null;
      description: string | null;
    }>(
      `SELECT id, date, amount, platform, description
       FROM class_ad_expenses
       WHERE class_id = ?
       ORDER BY date DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      expenses: expenses.map((exp) => ({
        id: exp.id,
        date: exp.date,
        amount: exp.amount,
        platform: exp.platform || '',
        description: exp.description || undefined,
      })),
    });
  } catch (error) {
    console.error('Get class expenses error:', error);
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
 * POST /api/classes/[id]/expenses
 * Create a new ad expense for a class
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
    const { date, amount, platform, description } = body;

    if (!date || amount === undefined) {
      return NextResponse.json(
        { error: 'Date and amount are required' },
        { status: 400 }
      );
    }

    const expenseId = `ad-${randomBytes(8).toString('hex')}`;
    const pool = getPool();

    await pool.execute(
      `INSERT INTO class_ad_expenses 
       (id, class_id, date, amount, platform, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        expenseId,
        id,
        date,
        amount,
        platform || null,
        description || null,
      ]
    );

    return NextResponse.json({
      success: true,
      expense: {
        id: expenseId,
        date,
        amount,
        platform: platform || '',
        description: description || undefined,
      },
    });
  } catch (error) {
    console.error('Create class expense error:', error);
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

