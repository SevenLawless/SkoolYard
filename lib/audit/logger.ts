import { getPool } from '@/lib/db/connection';
import { randomBytes } from 'crypto';

export type AuditAction =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'permission_change'
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'session_create'
  | 'session_destroy'
  | 'token_refresh'
  | 'unauthorized_access'
  | 'rate_limit_exceeded';

export type AuditStatus = 'success' | 'failure' | 'error';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  status: AuditStatus;
}

/**
 * Create an audit log entry
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    const pool = getPool();
    const id = randomBytes(16).toString('hex');
    
    await pool.execute(
      `INSERT INTO audit_logs 
       (id, user_id, action, resource_type, resource_id, ip_address, user_agent, details, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        data.userId || null,
        data.action,
        data.resourceType || null,
        data.resourceId || null,
        data.ipAddress || null,
        data.userAgent || null,
        data.details ? JSON.stringify(data.details) : null,
        data.status,
      ]
    );
  } catch (error) {
    // Don't throw - audit logging should not break the application
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: Request | { headers: Headers }): string {
  const headers = req.headers instanceof Headers ? req.headers : new Headers();
  
  // Check various headers for IP (in order of preference)
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: Request | { headers: Headers }): string {
  const headers = req.headers instanceof Headers ? req.headers : new Headers();
  return headers.get('user-agent') || 'unknown';
}

