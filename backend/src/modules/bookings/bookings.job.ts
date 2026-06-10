/**
 * Hold-expiry job processors.
 *
 * Seat release is delegated entirely to inventoryService — this module must
 * not write to the `seats` table directly (Table-ownership rule #2).
 */
import type { Job } from "bullmq";
import type { HoldExpiryJob } from "../../infra/queue/client";
import { inventoryService } from "../inventory";

/**
 * Per-hold expiry job (BullMQ delayed). Releases seats still held by this user
 * and cleans up their Redis keys. Conditional on status='held'+heldBy so
 * re-runs are harmless (idempotent).
 */
export async function processHoldExpiry(job: Job<HoldExpiryJob, void, "expire">): Promise<void> {
  const { userId, tripId, seatIds } = job.data;
  await inventoryService.releaseExpiredHold(seatIds, tripId, userId);
}

/**
 * Periodic sweeper (BullMQ repeatable job). Safety net that reclaims any
 * 'held' seat whose hold lapsed but whose per-hold job never ran (crash,
 * Redis flush, lost job). Idempotent — releases only seats past heldUntil.
 */
export async function processSeatSweep(): Promise<void> {
  await inventoryService.sweepExpiredHolds();
}
