/**
 * Redis-backed fixed-window rate limiter.
 *
 * Keyed by the authenticated user id when present, otherwise the client IP
 * (so pre-auth routes like login/register are still protected). Uses a single
 * INCR + EXPIRE per request — cheap and atomic enough for a fixed window.
 *
 * Fail-OPEN: if Redis is unreachable the request is allowed through. A rate
 * limiter must never become a self-inflicted outage on the auth path; the 429
 * is a best-effort abuse control, not a correctness guarantee.
 *
 * NOTE: IP-based limiting only works correctly when Express knows the real
 * client IP. `app.set("trust proxy", …)` is configured in app.ts to match the
 * number of proxies in front of the app.
 */
import type { Request, Response, NextFunction } from "express";
import { redis } from "../infra/redis/client";
import { logger } from "../infra/logger";
import { TooManyRequestsError } from "../shared/errors";

export interface RateLimitOptions {
  /** Namespace for the Redis key, e.g. "login". Keeps buckets independent. */
  keyPrefix: string;
  /** Max requests allowed within the window. */
  max: number;
  /** Window length in seconds. */
  windowSec: number;
}

export function rateLimit(opts: RateLimitOptions) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const identity = req.user?.id ?? req.ip ?? "unknown";
    const key = `rl:${opts.keyPrefix}:${identity}`;

    let count: number;
    try {
      count = await redis.incr(key);
      // Set the TTL only on the first hit of a new window.
      if (count === 1) await redis.expire(key, opts.windowSec);
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
