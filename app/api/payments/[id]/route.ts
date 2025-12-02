import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, queryOne, getPool } from '@/lib/db/connection';
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
 * GET /api/payments/[id]
 * Get a single payment by ID
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

    // Fetch payment
    const payment = await queryOne<{
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
       WHERE id = ?`,
      [id]
    );

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        type: payment.type,
        studentId: payment.student_id || undefined,
        teacherId: payment.teacher_id || undefined,
        staffId: payment.staff_id || undefined,
        classId: payment.class_id || undefined,
        invoiceNumber: payment.invoice_number || undefined,
        date: payment.date,
      },
    });
  } catch (error) {
    console.error('Get payment error:', error);
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
 * PUT /api/payments/[id]
 * Update a payment
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
    const { amount, status, type, studentId, teacherId, staffId, classId, invoiceNumber, date } = body;

    const pool = getPool();

    // Get existing payment to check if we need to generate invoice number
    const existing = await queryOne<{ status: string; invoice_number: string | null }>(
      `SELECT status, invoice_number FROM payments WHERE id = ?`,
      [id]
    );

    // Generate invoice number if status is being changed to paid and doesn't have one
    let finalInvoiceNumber = invoiceNumber;
    if (status === 'paid' && !finalInvoiceNumber && existing && !existing.invoice_number) {
      finalInvoiceNumber = `INV-${Date.now().toString().slice(-6)}-${id.slice(-4)}`;
    } else if (!finalInvoiceNumber && existing) {
      finalInvoiceNumber = existing.invoice_number || undefined;
    }

    // Update payment
    await pool.execute(
      `UPDATE payments
       SET amount = ?, status = ?, type = ?, student_id = ?, teacher_id = ?, 
           staff_id = ?, class_id = ?, invoice_number = ?, date = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        amount,
        status,
        type,
        studentId || null,
        teacherId || null,
        staffId || null,
        classId || null,
        finalInvoiceNumber || null,
        date,
        id,
      ]
    );

    // Log the update
    await logAuditEvent({
      action: 'user_update',
      userId: payload.userId,
      resourceType: 'payment',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { amount, status, type },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Payment updated successfully',
    });
  } catch (error) {
    console.error('Update payment error:', error);
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
 * DELETE /api/payments/[id]
 * Delete a payment
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

    // Delete payment
    await pool.execute(
      `DELETE FROM payments WHERE id = ?`,
      [id]
    );

    // Log the deletion
    await logAuditEvent({
      action: 'user_delete',
      userId: payload.userId,
      resourceType: 'payment',
      resourceId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: {},
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    console.error('Delete payment error:', error);
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

