interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache with TTL support
 * Data is automatically removed when it expires
 */
class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get a value from the cache
   * Returns null if the key doesn't exist or has expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if the entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in the cache with a TTL (time to live)
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlMs - Time to live in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Invalidate (delete) a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache keys matching a pattern
   * @param pattern - String pattern to match (simple string includes check)
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   * Called periodically to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Create a singleton cache instance
const cache = new InMemoryCache();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000);
}

export default cache;

// Export cache key builders for consistency
export const CacheKeys = {
  issues: () => 'issues:all',
  issueComments: (issueId: string) => `issue:${issueId}:comments`,
};
