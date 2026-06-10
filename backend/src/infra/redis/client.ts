/**
 * Redis access via ioredis. One shared client for the whole app.
 * Used later for seat holds (TTL), rate limiting, sessions, and BullMQ.
 * maxRetriesPerRequest: null is required for BullMQ compatibility.
 */
import Redis from "ioredis";
import { env } from "../../config/env";
import { logger } from "../logger";

export const redis = new Redis(env.REDIS_URL, {
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
