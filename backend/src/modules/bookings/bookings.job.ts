/**
 * Hold-expiry job processor.
 * BullMQ calls this after the TTL delay (~10 min). Releases any seat still
 * held by this user — conditional on status='held' so re-runs are harmless.
 */
import type { Job } from "bullmq";
import { prisma } from "../../infra/db/client";
import { redis } from "../../infra/redis/client";
import { logger } from "../../infra/logger";
import type { HoldExpiryJob } from "../../infra/queue/client";
import { bookingsRepository } from "./bookings.repository";

export async function processHoldExpiry(job: Job<HoldExpiryJob, void, "expire">): Promise<void> {
  const { userId, tripId, seatIds } = job.data;

  // Only release seats still held by this user (safe to re-run if payment succeeded)
  const result = await prisma.seat.updateMany({
    where: { id: { in: seatIds }, tripId, status: "held" },
    data:  { status: "available", heldUntil: null },
  });

  if (result.count > 0) {
    logger.info({ userId, tripId, count: result.count }, "Expired holds released");
  }

  // Clean up Redis keys (best-effort — they'll expire anyway via TTL)
  const pipeline = redis.pipeline();
  for (const seatId of seatIds) {
    pipeline.del(`seat_hold:${tripId}:${seatId}`);
  }
  pipeline.del(`user_hold:${userId}`);
  await pipeline.exec();
}

/**
 * Periodic sweeper (BullMQ repeatable job). The per-hold expiry job above is the
 * fast path; this is the safety net that reclaims any 'held' seat whose hold
 * lapsed but whose job never ran (never enqueued, lost on crash, Redis flushed).
 * Idempotent — releases only seats already past heldUntil.
 */
export async function processSeatSweep(): Promise<void> {
  const count = await bookingsRepository.releaseExpiredHolds(new Date());
  if (count > 0) {
    logger.info({ count }, "Seat sweeper reclaimed expired holds");
  }
}
