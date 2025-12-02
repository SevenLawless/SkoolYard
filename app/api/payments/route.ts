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
 * GET /api/payments
 * Get all payments
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

    // Fetch all payments
    const payments = await query<{
      id: string;
      amount: number;
      status: 'paid' | 'pending' | 'cancelled';
      type: 'student' | 'teacher' | 'staff';
      student_id: string | null;
      teacher_id: string | null;
      staff_id: string | null;
      class_id: string | null;
      invoice_number: string | null;
      date: string;
    }>(
      `SELECT id, amount, status, type, student_id, teacher_id, staff_id, class_id, invoice_number, date
       FROM payments
       ORDER BY date DESC`,
      []
    );

    // Format payments
    const formattedPayments = payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      type: p.type,
      studentId: p.student_id || undefined,
      teacherId: p.teacher_id || undefined,
      staffId: p.staff_id || undefined,
      classId: p.class_id || undefined,
      invoiceNumber: p.invoice_number || undefined,
      date: p.date,
    }));

    return NextResponse.json({
      success: true,
      payments: formattedPayments,
    });
  } catch (error) {
    console.error('Get payments error:', error);
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
 * POST /api/payments
 * Create a new payment
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
    const { amount, status, type, studentId, teacherId, staffId, classId, invoiceNumber, date } = body;

    // Validation
    if (amount === undefined || !status || !type || !date) {
      return NextResponse.json(
        { error: 'Amount, status, type, and date are required' },
        { status: 400 }
      );
    }

    if (!['paid', 'pending', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    if (!['student', 'teacher', 'staff'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    // Generate payment ID
    const paymentId = `pay-${randomBytes(8).toString('hex')}`;

    // Generate invoice number if status is paid and not provided
    const finalInvoiceNumber = invoiceNumber || (status === 'paid' ? `INV-${Date.now().toString().slice(-6)}-${paymentId.slice(-4)}` : undefined);

    const pool = getPool();

    // Insert payment
    await pool.execute(
      `INSERT INTO payments 
       (id, amount, status, type, student_id, teacher_id, staff_id, class_id, invoice_number, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        paymentId,
        amount,
        status,
        type,
        studentId || null,
        teacherId || null,
        staffId || null,
        classId || null,
        finalInvoiceNumber || null,
        date,
      ]
    );

    // Log the creation
    await logAuditEvent({
      action: 'user_create',
      userId: payload.userId,
      resourceType: 'payment',
      resourceId: paymentId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { amount, status, type },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentId,
        amount,
        status,
        type,
        studentId: studentId || undefined,
        teacherId: teacherId || undefined,
        staffId: staffId || undefined,
        classId: classId || undefined,
        invoiceNumber: finalInvoiceNumber || undefined,
        date,
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
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

