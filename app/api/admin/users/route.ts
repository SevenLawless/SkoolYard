import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, queryOne, query, getPool } from '@/lib/db/connection';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/password';
import { validatePassword } from '@/lib/auth/passwordValidation';
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
 * GET /api/admin/users
 * Get all users (Admin only)
 */
export async function GET() {
  try {
    // Ensure database is initialized
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
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users from database
    const users = await query<{
      id: string;
      username: string;
      role: 'admin' | 'staff' | 'parent';
      name: string;
      email: string;
      phone: string | null;
      staff_id: string | null;
      permissions: string | null;
      student_ids: string | null;
    }>(
      `SELECT id, username, role, name, email, phone, staff_id, permissions, student_ids
       FROM users
       ORDER BY created_at DESC`,
      [] // Empty params array
    );

    // Transform users to match frontend format
    const formattedUsers = users.map((u) => {
      let permissions: any = undefined;
      let studentIds: string[] = [];

      // Safely parse permissions JSON
      if (u.permissions) {
        try {
          permissions = JSON.parse(u.permissions);
        } catch (e) {
          console.error(`Error parsing permissions for user ${u.id}:`, e);
          permissions = undefined;
        }
      }

      // Safely parse student_ids JSON
      if (u.student_ids) {
        try {
          studentIds = JSON.parse(u.student_ids);
          if (!Array.isArray(studentIds)) {
            studentIds = [];
          }
        } catch (e) {
          console.error(`Error parsing student_ids for user ${u.id}:`, e);
          studentIds = [];
        }
      }

      return {
        id: u.id,
        username: u.username,
        role: u.role,
        name: u.name,
        email: u.email,
        phone: u.phone || undefined,
        staffId: u.staff_id || undefined,
        permissions,
        studentIds,
        password: '', // Never return password
      };
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error('Get users error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
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
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, role, name, email, phone, staffId, permissions, studentIds } = body;

    // Validation
    if (!username || !password || !role || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['admin', 'staff', 'parent'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          errors: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Prepare JSON fields
    const permissionsJson = permissions ? JSON.stringify(permissions) : null;
    const studentIdsJson = studentIds && studentIds.length > 0 ? JSON.stringify(studentIds) : null;

    // Generate user ID
    const userId = `usr-${randomBytes(8).toString('hex')}`;

    // Insert user
    const pool = getPool();
    await pool.execute(
      `INSERT INTO users 
       (id, username, password_hash, role, name, email, phone, staff_id, permissions, student_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        username,
        passwordHash,
        role,
        name,
        email,
        phone || null,
        staffId || null,
        permissionsJson,
        studentIdsJson,
      ]
    );

    // Log the creation
    await logAuditEvent({
      action: 'user_create',
      userId: payload.userId,
      resourceType: 'user',
      resourceId: userId,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: { username, role },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username,
        role,
        name,
        email,
        phone,
        staffId,
        permissions,
        studentIds,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

