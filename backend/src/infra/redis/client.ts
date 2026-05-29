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
