/**
 * Redis access via ioredis. One shared client for the APP request/runtime paths:
 * seat-hold cache (TTL), rate limiting, sessions, and payment PII staging.
 *
 * NOTE: BullMQ does NOT use this client — it builds its own connections from a
 * plain options object (see infra/queue/client.ts). So this client is tuned for
 * REQUEST-PATH resilience (bounded, fail-fast), not BullMQ's blocking semantics.
 *
 * Every request-path caller already degrades gracefully on a Redis error
 * (rate-limit fails open; seat-hold falls back to the DB sweeper; payment PII
 * staging logs + continues) — but only if the command FAILS rather than hangs.
 * The previous config (no commandTimeout, infinite offline queue) let a degraded
 * Redis — e.g. a WRONGPASS auth failure — block EVERY request for up to ioredis's
 * 10s connectTimeout, because the rate limiter runs on every route. commandTimeout
 * + enableOfflineQueue:false make those failures fast so the fallbacks fire.
 */
import Redis from "ioredis";
import { env } from "../../config/env";
import { logger } from "../logger";

export const redis = new Redis(env.REDIS_URL, {
  // Per-command deadline. Healthy commands to a managed Redis return in single-
  // digit ms, so 1s is a generous ceiling that guarantees a degraded/unreachable
  // Redis can never stall a request for the full 10s connectTimeout. When it
  // fires, the caller's existing .catch()/try-catch takes over (e.g. fail-open).
  commandTimeout: 1000,
  // Do NOT queue commands while disconnected. On a request path a queued command
  // would wait (up to commandTimeout) for a reconnect that may never come (e.g.
  // persistent WRONGPASS); failing immediately lets the fallbacks run with no
  // added latency. Safe here because every caller degrades gracefully.
  enableOfflineQueue: false,
  // null = never reject a command purely due to reconnect-retry count. Safe only
  // because commandTimeout (above) now bounds the total wait, and this client is
  // not shared with BullMQ (whose blocking commands need this setting).
  maxRetriesPerRequest: null,
  lazyConnect: true,
  // Managed Redis providers reset idle/blocking connections (ECONNRESET);
  // retry with capped backoff so the client self-heals instead of giving up.
  retryStrategy: (times) => Math.min(times * 200, 5000),
  // Reconnect (replaying the in-flight command) on transient socket errors and
  // on a failover that leaves us pointed at a read-only replica.
  reconnectOnError: (err) => /READONLY|ECONNRESET|ETIMEDOUT|EPIPE/.test(err.message),
});

// Without an 'error' listener ioredis surfaces socket errors as unhandled
// EventEmitter 'error' events — which crash the process. Log instead and let
// retryStrategy above handle reconnection. (This is the bare, non-JSON
// "Error: read ECONNRESET" that was reaching stderr.)
redis.on("error", (err: Error) => {
  logger.warn({ err: err.message }, "Redis connection error (will retry)");
});
redis.on("reconnecting", (ms: number) => {
  logger.warn({ delayMs: ms }, "Redis reconnecting");
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
  await redis.ping(); // prove the connection actually works
  logger.info("✅ Redis connected");
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit(); // graceful: waits for pending replies, then closes
  } catch {
    redis.disconnect(); // force-close if quit fails
  }
  logger.info("Redis disconnected");
}
