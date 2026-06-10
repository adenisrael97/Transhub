/**
 * Inventory service — public business logic for seat hold management.
 *
 * Owns the full hold lifecycle: DB transaction + Redis TTL keys + BullMQ
 * expiry job. Callers (bookings module) import only via inventory/index.ts.
 *
 * Methods that must run inside a caller's DB transaction (lockAndMarkBooked,
 * claimSeatsInTx, releaseUserHoldsInTx) accept a Tx parameter; standalone
 * operations (holdSeats, sweepExpiredHolds, releaseExpiredHold) manage their
 * own DB state.
 */
import { prisma } from "../../infra/db/client";
import { redis } from "../../infra/redis/client";
import { logger } from "../../infra/logger";
import { holdExpiryQueue } from "../../infra/queue/client";
import { inventoryRepository } from "./inventory.repository";
import type { HoldResult, Tx } from "./inventory.types";

const HOLD_TTL_SEC = 600; // 10 minutes

export const inventoryService = {
  /**
   * Phase A — Hold.
   *
   * Runs the DB transaction (release stale user holds + claim fresh seats),
   * then writes Redis TTL keys (fast cache) and enqueues the BullMQ expiry
   * job. Both post-transaction writes are best-effort: the DB hold already
   * committed with heldUntil so the periodic sweeper covers expiry even if
   * Redis or BullMQ are temporarily unavailable.
   */
  async holdSeats(tripId: string, quantity: number, userId: string): Promise<HoldResult> {
    const expiresAt = new Date(Date.now() + HOLD_TTL_SEC * 1000);

    const seatIds = await prisma.$transaction(async (tx) => {
      await inventoryRepository.releaseUserHoldsForTrip(tripId, userId, tx);
      return inventoryRepository.claimSeats(tripId, quantity, userId, expiresAt, tx);
      // claimSeats throws InsufficientSeatsError if rows < quantity (aborts tx)
    });

    const pipeline = redis.pipeline();
    for (const seatId of seatIds) {
      pipeline.set(`seat_hold:${tripId}:${seatId}`, userId, "EX", HOLD_TTL_SEC);
    }
    pipeline.set(
      `user_hold:${userId}`,
      JSON.stringify(seatIds.map((seatId) => ({ tripId, seatId }))),
      "EX",
      HOLD_TTL_SEC
    );
    await pipeline.exec().catch((err) => {
      logger.warn(
        { err, userId, tripId, seatCount: seatIds.length },
        "Failed to write Redis hold keys (sweeper still covers expiry)"
      );
    });

    await holdExpiryQueue
      .add("expire", { userId, tripId, seatIds }, { delay: HOLD_TTL_SEC * 1000 })
      .catch((err) => {
        logger.warn(
          { err, userId, tripId, seatCount: seatIds.length },
          "Failed to enqueue hold-expiry job (sweeper still covers expiry)"
        );
      });

    return {
      holdId:     `${userId}:${tripId}:${Date.now()}`,
      expiresAt:  expiresAt.toISOString(),
      ttlSeconds: HOLD_TTL_SEC,
      tripId,
      quantity,
    };
  },

  /**
   * Lock seats and mark them booked in the caller's transaction.
   * Called by bookings.service during the confirm phase. Throws HoldExpiredError
   * if any seat is no longer available (another transaction already booked it).
   */
  async lockAndMarkBooked(tripId: string, seatIds: string[], userId: string, tx: Tx): Promise<void> {
    return inventoryRepository.lockAndMarkBooked(tripId, seatIds, userId, tx);
  },

  /**
   * The seat IDs this user currently holds for a trip. Used by payment init
   * to compute the booking amount against the durable DB record (not Redis),
   * so payment init survives a Redis outage.
   */
  async heldSeatIds(tripId: string, userId: string): Promise<string[]> {
    return inventoryRepository.heldSeatIds(tripId, userId, new Date());
  },

  /**
   * Release specific held seats and clean up their Redis keys.
   * Called by the BullMQ hold-expiry job processor (bookings.job.ts).
   */
  async releaseExpiredHold(seatIds: string[], tripId: string, userId: string): Promise<void> {
    const count = await inventoryRepository.releaseSpecificHold(seatIds, tripId, userId);
    if (count > 0) {
      logger.info({ userId, tripId, count }, "Expired holds released");
    }

    const pipeline = redis.pipeline();
    for (const seatId of seatIds) {
      pipeline.del(`seat_hold:${tripId}:${seatId}`);
    }
    pipeline.del(`user_hold:${userId}`);
    await pipeline.exec();
  },

  /**
   * Clean up Redis hold keys after a booking is confirmed.
   * Called by bookings.service after the confirm transaction commits.
   * Best-effort — keys have a TTL and self-clean even if this fails.
   */
  async releaseHoldKeys(tripId: string, seatIds: string[], userId: string): Promise<void> {
    const pipeline = redis.pipeline();
    for (const seatId of seatIds) {
      pipeline.del(`seat_hold:${tripId}:${seatId}`);
    }
    pipeline.del(`user_hold:${userId}`);
    await pipeline.exec().catch((err) => {
      // Non-fatal: the keys carry a TTL and self-expire. Log so a persistent
      // Redis problem is visible rather than silently swallowed.
      logger.warn(
        { err, userId, tripId, seatCount: seatIds.length },
        "Failed to release Redis hold keys after confirm (keys self-expire via TTL)"
      );
    });
  },

  /**
   * Periodic safety-net sweeper: reclaim any 'held' seat whose hold lapsed
   * but whose BullMQ job never ran (e.g. crash, Redis flush, lost job).
   * Called by the repeatable BullMQ sweeper job.
   */
  async sweepExpiredHolds(): Promise<number> {
    const count = await inventoryRepository.sweepExpiredHolds(new Date());
    if (count > 0) {
      logger.info({ count }, "Seat sweeper reclaimed expired holds");
    }
    return count;
  },
};
