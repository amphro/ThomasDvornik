const LIMIT = 3;
const WINDOW_SECS = 86400; // 24 hours

type RateLimitState = { count: number; windowStart: number };

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSecs: number };

export async function checkRateLimit(
  kv: KVNamespace,
  ip: string
): Promise<RateLimitResult> {
  const key = `rl:${ip}`;
  const now = Date.now();
  const windowMs = WINDOW_SECS * 1000;

  const existing = await kv.get<RateLimitState>(key, 'json');

  if (existing && now - existing.windowStart < windowMs) {
    if (existing.count >= LIMIT) {
      const retryAfterSecs = Math.ceil((existing.windowStart + windowMs - now) / 1000);
      return { allowed: false, retryAfterSecs };
    }
    const ttl = Math.ceil((existing.windowStart + windowMs - now) / 1000);
    await kv.put(key, JSON.stringify({ count: existing.count + 1, windowStart: existing.windowStart }), {
      expirationTtl: ttl,
    });
    return { allowed: true, remaining: LIMIT - existing.count - 1 };
  }

  await kv.put(key, JSON.stringify({ count: 1, windowStart: now }), {
    expirationTtl: WINDOW_SECS,
  });
  return { allowed: true, remaining: LIMIT - 1 };
}
