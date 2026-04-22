import { LRUCache } from "lru-cache";

type Bucket = { count: number; reset: number };

const buckets = new LRUCache<string, Bucket>({ max: 5000, ttl: 60 * 60 * 1000 });

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  reset: number;
  limit: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.reset < now) {
    const reset = now + windowMs;
    buckets.set(key, { count: 1, reset });
    return { ok: true, remaining: limit - 1, reset, limit };
  }
  existing.count += 1;
  buckets.set(key, existing);
  return {
    ok: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    reset: existing.reset,
    limit,
  };
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(Math.max(0, r.remaining)),
    "X-RateLimit-Reset": String(Math.floor(r.reset / 1000)),
  };
}

export function clientKey(req: Request, extra = ""): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "anon";
  return `${ip}:${extra}`;
}
