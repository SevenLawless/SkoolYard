import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, consider Redis)
const store: RateLimitStore = {};

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute

/**
 * Rate limit middleware
 * Limits requests to MAX_REQUESTS per WINDOW_MS per IP
 */
export function rateLimit(req: NextRequest): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const ip = getClientIp(req);
  const now = Date.now();
  const key = `rate_limit:${ip}`;

  // Get or create entry
  let entry = store[key];
  
  if (!entry || entry.resetTime < now) {
    // Create new window
    entry = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    store[key] = entry;
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP from request
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // NextRequest doesn't have .ip property, use headers instead
  return 'unknown';
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  resetTime: number
): NextResponse {
  const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000);
  
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: resetSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': resetSeconds.toString(),
        'X-RateLimit-Limit': MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}

