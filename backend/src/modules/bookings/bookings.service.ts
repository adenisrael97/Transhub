/**
 * Bookings business logic — two-phase hold → confirm.
 *
 * Hold:   DB transaction (available→held) + Redis TTL keys + BullMQ expiry job.
 * Confirm: idempotency check → Prisma $transaction (SELECT FOR UPDATE + booked) →
 *           delete Redis keys → emit booking.confirmed.
 */
import { prisma } from "../../infra/db/client";
import { redis } from "../../infra/redis/client";
import { logger } from "../../infra/logger";
import { ConflictError, NotFoundError, ForbiddenError } from "../../shared/errors";
import { eventBus } from "../../infra/events";
import { holdExpiryQueue } from "../../infra/queue/client";
import { bookingsRepository, type BookingDTO, type TripPassengerDTO } from "./bookings.repository";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import type { HoldInput, ConfirmInput } from "./bookings.schema";

const HOLD_TTL_SEC = 600; // 10 minutes

export interface HoldResult {
  holdId:    string;
  expiresAt: string; // ISO-8601
  tripId:    string;
  quantity:  number;
}

export const bookingsService = {
  /**
   * Phase A — Hold.
   * Wraps the DB updateMany in a transaction so a partial hold (some seats
   * already taken) rolls back atomically.  Redis + BullMQ writes happen only
   * after the DB transaction commits.
   */
  async hold(input: HoldInput, userId: string): Promise<HoldResult> {
    const { tripId, quantity } = input;

    // Verify trip exists and is bookable
    const tripState = await bookingsRepository.findTripBookingState(tripId);
    if (tripState === null) throw new NotFoundError("Trip not found");
    if (!["scheduled", "active"].includes(tripState.status)) {
      throw new ConflictError("This trip is not available for booking");
    }
    if (!tripState.isActive) {
      throw new ConflictError("This trip is not currently accepting bookings");
    }
    if (tripState.isFull) {
      throw new ConflictError("This trip is marked full");
    }

    // heldUntil is the DB-side expiry stamp; it must be set inside the hold
    // transaction so the sweeper can reclaim the seat even if everything after
    // the commit (Redis, BullMQ) fails.
    const expiresAt = new Date(Date.now() + HOLD_TTL_SEC * 1000);

    // Atomically claim `quantity` free slots inside a transaction. claimAvailableSeats
    // uses FOR UPDATE SKIP LOCKED so concurrent claims take disjoint rows and total
    // holds can never exceed capacity. Fewer than requested → trip is full → 409.
    const seatIds = await prisma.$transaction(async (tx) => {
      const claimed = await bookingsRepository.claimAvailableSeats(tripId, quantity, userId, expiresAt, tx);
      if (claimed.length < quantity) {
        throw new ConflictError("Not enough seats available on this trip");
      }
      return claimed;
    });

    // DB committed — now write Redis hold keys
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
      logger.warn({ err, tripId }, "Failed to write Redis hold keys (sweeper still covers expiry)");
    });

    // Enqueue the fast per-hold expiry job. Best-effort: the DB hold has already
    // committed with heldUntil, and the periodic sweeper will reclaim it, so a
    // failed enqueue must NOT fail the request (which would leave the caller with
    // a 500 despite a valid hold). The job is just the faster release path.
    await holdExpiryQueue
      .add("expire", { userId, tripId, seatIds }, { delay: HOLD_TTL_SEC * 1000 })
      .catch((err) => {
        logger.warn({ err, tripId }, "Failed to enqueue hold-expiry job (sweeper still covers expiry)");
      });

    // Opaque client-side hold reference (for telemetry / debugging only — the
    // server tracks the real hold via Redis keys + the BullMQ expiry job).
    return {
      holdId:    `${userId}:${tripId}:${Date.now()}`,
      expiresAt: expiresAt.toISOString(),
      tripId,
      quantity,
    };
  },

  /**
   * Phase B — Confirm (called from payment webhook or simulated payment).
   * Idempotent: same paymentRef always returns the same booking.
   */
  async confirm(input: ConfirmInput, userId: string): Promise<BookingDTO> {
    const { paymentRef, tripId, seatIds } = input;

    // Idempotency: same webhook firing twice → return existing booking
    const existing = await bookingsRepository.findByPaymentRef(paymentRef);
    if (existing) return existing;

    const price = await bookingsRepository.findTripPrice(tripId);
    if (price === null) throw new NotFoundError("Trip not found");

    const totalAmount = seatIds.length * price;

    // Single transaction: SELECT FOR UPDATE → update status → create booking + passenger info
    let booking: BookingDTO;
    try {
      booking = await prisma.$transaction(async (tx) => {
        return bookingsRepository.confirmSeats(
          tripId,
          seatIds,
          { userId, totalAmount, paymentRef, passengers: input.passengers },
          tx
        );
      });
    } catch (err) {
      // Two identical webhooks can race past the pre-check above and both enter
      // confirm; the loser's SELECT FOR UPDATE sees the seats already booked and
      // throws ConflictError. Re-check by paymentRef: if a booking now exists it
      // was THIS payment (the winner), so return it — duplicate webhooks are
      // idempotent, not a "seats unavailable" refund case. A genuine conflict
      // (no booking for this ref) still propagates.
      if (err instanceof ConflictError) {
        const raced = await bookingsRepository.findByPaymentRef(paymentRef);
        if (raced) return raced;
      }
      throw err;
    }

    // Clean up Redis (best-effort; TTL will self-clean even if this fails)
    const pipeline = redis.pipeline();
    for (const seatId of seatIds) {
      pipeline.del(`seat_hold:${tripId}:${seatId}`);
    }
    pipeline.del(`user_hold:${userId}`);
    await pipeline.exec().catch(() => {});

    // Notify Phase 7 subscribers (notifications, tickets)
    eventBus.emit("booking.confirmed", {
      bookingId:   booking.id,
      userId,
      tripId,
      seatIds,
      totalAmount,
      paymentRef,
    });

    return booking;
  },

  /** List bookings (paginated): passenger → own; admin → all; operator → their trips. */
  async list(
    userId: string,
    role: string,
    pagination: PaginationQuery,
    operatorId?: string | null
  ): Promise<{ bookings: BookingDTO[]; pagination: PageMeta }> {
    let items: BookingDTO[];
    let total: number;

    if (role === "admin") {
      ({ items, total } = await bookingsRepository.findAll(pagination));
    } else if (role === "operator" && operatorId) {
      ({ items, total } = await bookingsRepository.findByOperator(operatorId, pagination));
    } else {
      ({ items, total } = await bookingsRepository.findByUser(userId, pagination));
    }

    return { bookings: items, pagination: pageMeta(total, pagination) };
  },

  /**
   * Return the passenger list for a trip.
   * Access: operator who owns the trip OR driver whose phone matches driverNumber.
   */
  async getPassengersByTripId(
    tripId:          string,
    requesterId:     string,
    requesterRole:   string,
    requesterPhone?: string
  ): Promise<TripPassengerDTO[]> {
    // Verify trip exists and that the requester may access it
    const trip = await prisma.trip.findUnique({
      where:  { id: tripId },
      select: { operatorId: true, driverNumber: true, operator: { select: { user: { select: { id: true } } } } },
    });
    if (!trip) throw new NotFoundError("Trip not found");

    const isOwner  = trip.operator?.user?.id === requesterId;
    const isDriver = requesterRole === "driver" && requesterPhone && trip.driverNumber === requesterPhone;
    const isAdmin  = requesterRole === "admin";

    if (!isOwner && !isDriver && !isAdmin) {
      throw new ForbiddenError("You do not have access to this trip's passenger list");
    }

    return bookingsRepository.findPassengersByTripId(tripId);
  },

  /** Look up a booking by its payment reference (used by payments module for idempotency + verify). */
  async getByPaymentRef(paymentRef: string): Promise<BookingDTO | null> {
    return bookingsRepository.findByPaymentRef(paymentRef);
  },

  /**
   * The seat IDs this user currently holds for a trip — the authoritative set
   * payment initialization uses to compute the amount and build the webhook
   * metadata. Verified against the DB (not Redis) so payment init survives a
   * Redis outage during the hold phase. Empty array → no live hold.
   */
  async getHeldSeatIds(tripId: string, userId: string): Promise<string[]> {
    return bookingsRepository.idsHeldBy(tripId, userId, new Date());
  },

  /** Get a single booking — owner or admin only. */
  async getById(id: string, userId: string, role: string): Promise<BookingDTO> {
    const booking = await bookingsRepository.findById(id);
    if (!booking) throw new NotFoundError("Booking not found");
    if (role !== "admin" && booking.userId !== userId) {
      throw new ForbiddenError("You cannot access this booking");
    }
    return booking;
  },
};
