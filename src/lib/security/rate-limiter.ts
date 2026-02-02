interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetIn: number;
}

/**
 * Simple IP-based rate limiter
 * Tracks comment submissions per IP address
 */
class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private maxComments: number;
  private windowMs: number;

  constructor() {
    this.maxComments = parseInt(process.env.RATE_LIMIT_MAX_COMMENTS || '5', 10);
    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10); // 1 hour default

    // Clean up expired entries every 10 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }
  }

  /**
   * Check if an IP address is within rate limits
   */
  check(ip: string): RateLimitResult {
    const now = Date.now();
    const entry = this.limits.get(ip);

    // No entry or expired entry - allow and create new
    if (!entry || now > entry.resetAt) {
      this.limits.set(ip, {
        count: 1,
        resetAt: now + this.windowMs,
      });

      return {
        allowed: true,
        limit: this.maxComments,
        remaining: this.maxComments - 1,
        resetIn: this.windowMs,
      };
    }

    // Entry exists and not expired
    const remaining = this.maxComments - entry.count;

    // Already at limit
    if (entry.count >= this.maxComments) {
      return {
        allowed: false,
        limit: this.maxComments,
        remaining: 0,
        resetIn: entry.resetAt - now,
      };
    }

    // Increment count
    entry.count++;

    return {
      allowed: true,
      limit: this.maxComments,
      remaining: remaining - 1,
      resetIn: entry.resetAt - now,
    };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [ip, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        keysToDelete.push(ip);
      }
    }

    keysToDelete.forEach(ip => this.limits.delete(ip));
  }

  /**
   * Reset rate limit for a specific IP (useful for testing)
   */
  reset(ip: string): void {
    this.limits.delete(ip);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.limits.clear();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Check if an IP is within rate limits
 */
export function checkRateLimit(ip: string): RateLimitResult {
  return rateLimiter.check(ip);
}

export default rateLimiter;
