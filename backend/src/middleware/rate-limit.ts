/**
 * Redis-backed fixed-window rate limiter.
 *
 * Keyed by the authenticated user id when present, otherwise the client IP.
 * Public routes (where `authenticate` hasn't run yet) always key by IP.
 *
 * ATOMICITY: count + TTL-set are performed in a single Lua script evaluated
 * atomically by Redis. The previous two-command approach (INCR then EXPIRE)
 * had a window between the two calls: if the process crashed or lost the
 * connection after INCR but before EXPIRE, the key would persist with no TTL
 * and permanently rate-limit that identity until manual Redis cleanup.
 *
 * Fail-OPEN: if Redis is unreachable the request is allowed through. A rate
 * limiter is best-effort abuse control, not a correctness guarantee — it must
 * never become a self-inflicted outage on the auth path.
 *
 * NOTE: IP-based limiting only works correctly when Express knows the real
 * client IP. `app.set("trust proxy", 1)` is configured in app.ts.
 */
import type { Request, Response, NextFunction } from "express";
import { redis } from "../infra/redis/client";
import { env } from "../config/env";
import { logger } from "../infra/logger";
import { TooManyRequestsError } from "../shared/errors";

export interface RateLimitOptions {
  keyPrefix: string;
  max: number;
  windowSec: number;
}

/**
 * Lua: atomically increment the counter and set the TTL on first hit.
 * Returns the new count as a Redis integer reply.
 *
 * KEYS[1]  = rate-limit key
 * ARGV[1]  = window in seconds
 *
 * Using KEYS/ARGV (not inline values) so Redis Cluster can route the command
 * to the correct shard, and so the script is eligible for Redis caching.
 */
const INCR_WITH_EXPIRE_LUA = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
` as const;

// Disabled under NODE_ENV=test so integration tests (which legitimately create
// many users and fire bursts from one IP) aren't throttled. Production and dev
// always enforce. There is intentionally no separate "disable" flag — reusing
// NODE_ENV keeps the prod default on and adds no config surface.
const RATE_LIMITING_ENABLED = env.NODE_ENV !== "test";

export function rateLimit(opts: RateLimitOptions) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!RATE_LIMITING_ENABLED) return next();

    // req.user is only populated after authenticate() runs. For pre-auth routes
    // (login, register, public endpoints) this falls back to IP, which is correct.
    const identity = req.user?.id ?? req.ip ?? "unknown";
    const key = `rl:${opts.keyPrefix}:${identity}`;

    let count: number;
    try {
      // eval(script, numkeys, ...keys, ...args) — one round-trip, atomic.
      count = (await redis.eval(
        INCR_WITH_EXPIRE_LUA,
        1,         // numkeys
        key,       // KEYS[1]
        String(opts.windowSec) // ARGV[1]
      )) as number;
    } catch (err) {
      logger.warn({ err, keyPrefix: opts.keyPrefix }, "rate-limit check failed — allowing request");
      return next();
    }

    if (count > opts.max) {
      const ttl = await redis.ttl(key).catch(() => opts.windowSec);
      const retryAfter = Math.max(ttl, 1);
      _res.setHeader("Retry-After", String(retryAfter));
      throw new TooManyRequestsError(retryAfter);
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// Named limiters (applied in app.ts / module routes)
// ---------------------------------------------------------------------------

/** 15 req / 15 min — auth endpoints (login, register). Blunts credential stuffing. */
export const authLimiter = rateLimit({ keyPrefix: "auth", max: 15, windowSec: 900 });

/** 100 req / 1 min per identity — global API guard. Applied in app.ts before routes. */
export const apiLimiter = rateLimit({ keyPrefix: "api", max: 100, windowSec: 60 });

/** 300 req / 1 min — Paystack webhook. High ceiling because legitimate retries burst. */
export const webhookLimiter = rateLimit({ keyPrefix: "webhook", max: 300, windowSec: 60 });
