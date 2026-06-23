const LIMIT = 2;
const WINDOW_SECS = 86400;

type RateLimitState = { count: number; windowStart: number };

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSecs: number };

// Read-only check — does not increment. Call consumeRateLimit only on success.
export async function checkRateLimit(
  kv: KVNamespace,
  bucket: string,
  ip: string
): Promise<RateLimitResult> {
  const key = `rl:${bucket}:${ip}`;
  const now = Date.now();
  const windowMs = WINDOW_SECS * 1000;

  const existing = await kv.get<RateLimitState>(key, 'json');

  if (existing && now - existing.windowStart < windowMs) {
    if (existing.count >= LIMIT) {
      const retryAfterSecs = Math.ceil((existing.windowStart + windowMs - now) / 1000);
      return { allowed: false, retryAfterSecs };
    }
    return { allowed: true, remaining: LIMIT - existing.count - 1 };
  }

  return { allowed: true, remaining: LIMIT - 1 };
}

// Increments the counter. Call only after a successful response.
export async function consumeRateLimit(
  kv: KVNamespace,
  bucket: string,
  ip: string
): Promise<number> {
  const key = `rl:${bucket}:${ip}`;
  const now = Date.now();
  const windowMs = WINDOW_SECS * 1000;

  const existing = await kv.get<RateLimitState>(key, 'json');

  if (existing && now - existing.windowStart < windowMs) {
    const newCount = existing.count + 1;
    const ttl = Math.max(60, Math.ceil((existing.windowStart + windowMs - now) / 1000));
    await kv.put(key, JSON.stringify({ count: newCount, windowStart: existing.windowStart }), {
      expirationTtl: ttl,
    });
    return Math.max(0, LIMIT - newCount);
  }

  await kv.put(key, JSON.stringify({ count: 1, windowStart: now }), {
    expirationTtl: WINDOW_SECS,
  });
  return LIMIT - 1;
}
