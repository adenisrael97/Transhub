/**
 * Inventory repository — THE ONLY WRITER to the `seats` table.
 *
 * All seat state transitions (available → held → booked, and reversals) live
 * here. No other module may import this file; call inventoryService via
 * inventory/index.ts instead.
 *
 * Concurrency guarantee: claimSeats uses FOR UPDATE SKIP LOCKED so two
 * concurrent transactions claim disjoint rows — total holds can never exceed
 * capacity. lockAndMarkBooked uses a plain FOR UPDATE so concurrent confirms
 * on the same seats serialise here, and the first to commit wins.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { InsufficientSeatsError, HoldExpiredError } from "../../shared/errors";
import type { Tx } from "./inventory.types";

export const inventoryRepository = {
  /**
   * Atomically claim up to `quantity` available seat-slots for this trip and
   * transition them available → held, stamping heldUntil/heldBy.
   *
   * FOR UPDATE SKIP LOCKED is the key to race-freedom: concurrent claims each
   * lock a DISJOINT set of rows (the loser skips the rows the winner just
   * locked instead of blocking). Total holds can never exceed capacity.
   * Throws InsufficientSeatsError if fewer than `quantity` rows are free.
   * Must be called inside a caller-supplied transaction.
   */
  async claimSeats(
    tripId:    string,
    quantity:  number,
    userId:    string,
    heldUntil: Date,
    tx:        Tx
  ): Promise<string[]> {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM seats
      WHERE  "tripId" = ${tripId} AND status = 'available'
      ORDER BY label
      LIMIT  ${quantity}
      FOR UPDATE SKIP LOCKED
    `;

    if (rows.length < quantity) {
      throw new InsufficientSeatsError();
    }

    const ids = rows.map((r) => r.id);
    await tx.seat.updateMany({
      where: { id: { in: ids } },
      data:  { status: "held", heldUntil, heldBy: userId },
    });
    return ids;
  },

  /**
   * Release any seats this user is currently holding for a trip, transitioning
   * them held → available. Runs inside the hold transaction so a re-hold (e.g.
   * double-tap, user changes quantity) can never leave stale duplicate holds.
   * Scoped to held+heldBy so it never touches booked seats or another user's holds.
   */
  async releaseUserHoldsForTrip(tripId: string, userId: string, tx: Tx): Promise<void> {
    await tx.seat.updateMany({
      where: { tripId, status: "held", heldBy: userId },
      data:  { status: "available", heldUntil: null, heldBy: null },
    });
  },

  /**
   * Lock the requested seats and transition them held/available → booked.
   * Uses a plain FOR UPDATE (not SKIP LOCKED) so concurrent confirms on the
   * same seats serialise here — the first commit wins, the second gets
   * fewer locked rows than requested and throws HoldExpiredError.
   * Must be called inside a caller-supplied transaction.
   */
  async lockAndMarkBooked(
    tripId:  string,
    seatIds: string[],
    userId:  string,
    tx:      Tx
  ): Promise<void> {
    const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM seats
      WHERE  "tripId" = ${tripId}
      AND    id IN (${Prisma.join(seatIds)})
      AND    (status = 'available' OR (status = 'held' AND "heldBy" = ${userId}))
      FOR UPDATE
    `;

    if (lockedRows.length < seatIds.length) {
      throw new HoldExpiredError("One or more seats are no longer available");
    }

    await tx.seat.updateMany({
      where: { id: { in: seatIds } },
      data:  { status: "booked", heldUntil: null, heldBy: null },
    });
  },

  /**
   * The seat IDs this user currently holds for a trip — the authoritative set
   * used by payment init to compute the amount and build the webhook metadata.
   * Reads from the main client (not a tx): a seat counts only if still 'held',
   * stamped with this userId, and not past its expiry.
   */
  async heldSeatIds(tripId: string, userId: string, now: Date): Promise<string[]> {
    const rows = await prisma.seat.findMany({
      where:  { tripId, status: "held", heldBy: userId, heldUntil: { gt: now } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  },

  /**
   * Release ONLY seats still held by THIS user for a specific trip+seatIds combo.
   * The heldBy guard is critical: if this job runs late after the hold already
   * expired and the seat was re-held by a different user, a status-only filter
   * would wrongly release that fresh hold. Returns the count of released seats.
   */
  async releaseSpecificHold(seatIds: string[], tripId: string, userId: string): Promise<number> {
    const result = await prisma.seat.updateMany({
      where: { id: { in: seatIds }, tripId, status: "held", heldBy: userId },
      data:  { status: "available", heldUntil: null, heldBy: null },
    });
    return result.count;
  },

  /**
   * Safety-net sweeper: reclaim seats stuck in 'held' past their expiry.
   * Wrapped in bounded retry for transient DB blips. Idempotent — only releases
   * seats already past heldUntil.
   */
  async sweepExpiredHolds(now: Date): Promise<number> {
    const MAX_ATTEMPTS = 3;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await prisma.seat.updateMany({
          where: { status: "held", heldUntil: { lt: now } },
          data:  { status: "available", heldUntil: null, heldBy: null },
        });
        return result.count;
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 2 ** attempt * 250)); // 500ms, 1s
        }
      }
    }
    throw lastErr;
  },
};
