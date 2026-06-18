import Redis from 'ioredis';

/**
 * Singleton Redis client.
 *
 * Redis is used for:
 *  - Distributed locks to prevent double quiz submissions (anti double-click /
 *    multi-tab race conditions).
 *  - Caching expensive dashboard aggregations with a short TTL.
 *
 * The client connects lazily and degrades gracefully: if Redis is unreachable
 * the helpers below fail open, so the application keeps working and relies on
 * the database unique constraint (`@@unique([studentId, quizId])`) as the
 * ultimate guarantee against duplicate attempts.
 */
const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

function createClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('[redis] REDIS_URL not set — running without Redis (degraded locks/cache).');
    return null;
  }

  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    retryStrategy(times) {
      // Stop hammering a dead server; back off up to 5s.
      if (times > 5) return null;
      return Math.min(times * 200, 5000);
    },
  });

  client.on('error', (err) => {
    // Avoid crashing the process on transient connection errors.
    console.error('[redis] connection error:', err.message);
  });

  // Kick off the lazy connection without blocking module evaluation.
  client.connect().catch((err) => {
    console.error('[redis] initial connect failed:', err.message);
  });

  return client;
}

export const redis: Redis | null =
  globalForRedis.redis !== undefined ? globalForRedis.redis : createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

/**
 * Try to acquire a distributed lock. Returns true if acquired (or if Redis is
 * unavailable, in which case we fail open). The caller must release it.
 */
export async function acquireLock(key: string, ttlMs = 15000): Promise<boolean> {
  if (!redis || redis.status !== 'ready') return true; // fail open
  try {
    const result = await redis.set(key, '1', 'PX', ttlMs, 'NX');
    return result === 'OK';
  } catch (err) {
    console.error('[redis] acquireLock failed, failing open:', (err as Error).message);
    return true;
  }
}

export async function releaseLock(key: string): Promise<void> {
  if (!redis || redis.status !== 'ready') return;
  try {
    await redis.del(key);
  } catch {
    /* ignore */
  }
}

/** Cache helper: read a JSON value. Returns null on miss or any failure. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis || redis.status !== 'ready') return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Cache helper: write a JSON value with a TTL (seconds). */
export async function cacheSet(key: string, value: unknown, ttlSeconds = 30): Promise<void> {
  if (!redis || redis.status !== 'ready') return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    /* ignore */
  }
}

/** Invalidate one or more cache keys. */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (!redis || redis.status !== 'ready' || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    /* ignore */
  }
}
