/**
 * Bookings business logic — two-phase hold → confirm.
 *
 * Hold:    trip-state validation → inventoryService.holdSeats (owns the DB
 *          transaction + Redis TTL keys + BullMQ expiry job).
 * Confirm: idempotency check → prisma.$transaction(inventoryService.lockAndMarkBooked
 *          + bookingsRepository.createBookingRecord) → Redis cleanup → events.
 *
 * This service must NOT write to the `seats` table directly — that is owned
 * by the inventory module (Table-ownership rule #2).
 */
import { prisma } from "../../infra/db/client";
import { ConflictError, NotFoundError, ForbiddenError } from "../../shared/errors";
import { eventBus } from "../../infra/events";
import { bookingsRepository, type BookingDTO, type TripPassengerDTO, type BookingListFilter } from "./bookings.repository";
import { inventoryService } from "../inventory";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import type { HoldInput, ConfirmInput } from "./bookings.schema";
import type { HoldResult } from "../inventory";

export { type HoldResult };

export const bookingsService = {
  /**
   * Phase A — Hold.
   * Validates trip state (bookings concern), then delegates the full seat-claim
   * transaction + Redis + BullMQ to inventoryService.holdSeats.
   */
  async hold(input: HoldInput, userId: string): Promise<HoldResult> {
    const { tripId, quantity } = input;

    const tripState = await bookingsRepository.findTripBookingState(tripId);
    if (tripState === null) throw new NotFoundError("Trip not found");
    if (!["scheduled", "active"].includes(tripState.status)) {
      throw new ConflictError("This trip is not available for booking", "TRIP_UNAVAILABLE");
    }
    if (!tripState.isActive) {
      throw new ConflictError("This trip is not currently accepting bookings", "TRIP_UNAVAILABLE");
    }
    if (tripState.isFull) {
      throw new ConflictError("This trip is marked full", "TRIP_FULL");
    }

    return inventoryService.holdSeats(tripId, quantity, userId);
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

    // Single transaction: inventory locks + marks seats booked → booking record created
    let booking: BookingDTO;
    try {
      booking = await prisma.$transaction(async (tx) => {
        await inventoryService.lockAndMarkBooked(tripId, seatIds, userId, tx);
        return bookingsRepository.createBookingRecord(
          tripId,
          seatIds,
          { userId, totalAmount, paymentRef, passengers: input.passengers },
          tx
        );
      });
    } catch (err) {
      // Two identical webhooks can race past the pre-check above and both enter
      // confirm; the loser's SELECT FOR UPDATE sees the seats already booked and
      // throws HoldExpiredError (extends ConflictError). Re-check by paymentRef:
      // if a booking now exists it was THIS payment (the winner), so return it —
      // duplicate webhooks are idempotent, not a "seats unavailable" refund case.
      if (err instanceof ConflictError) {
        const raced = await bookingsRepository.findByPaymentRef(paymentRef);
        if (raced) return raced;
      }
      throw err;
    }

    // Release Redis hold keys (best-effort; TTL self-cleans even if this fails)
    await inventoryService.releaseHoldKeys(tripId, seatIds, userId);

    // Notify Phase 7 subscribers (notifications, tickets)
    eventBus.emit("booking.confirmed", {
      bookingId:   booking.id,
      userId,
      tripId,
      seatIds,
      totalAmount,
      paymentRef,
    });

    if (booking.trip) {
      eventBus.emit("booking.created", {
        operatorId: booking.trip.operatorId,
        bookingId:  booking.id,
        tripId,
      });
    }

    return booking;
  },

  /**
   * List bookings (paginated + filtered): passenger → own; admin → all; operator
   * → their trips. The role-appropriate scope is enforced in the repository so a
   * passenger/operator can never widen their view via query params.
   */
  async list(
    userId: string,
    role: string,
    filter: BookingListFilter,
    pagination: PaginationQuery,
    operatorId?: string | null
  ): Promise<{ bookings: BookingDTO[]; pagination: PageMeta }> {
    let items: BookingDTO[];
    let total: number;

    if (role === "admin") {
      ({ items, total } = await bookingsRepository.findAll(filter, pagination));
    } else if (role === "operator" && operatorId) {
      ({ items, total } = await bookingsRepository.findByOperator(operatorId, filter, pagination));
    } else {
      ({ items, total } = await bookingsRepository.findByUser(userId, filter, pagination));
    }

    return { bookings: items, pagination: pageMeta(total, pagination) };
  },

  /**
   * Return the passenger list for a trip.
   * Access: operator who owns the trip, the driver assigned to it (by FK driverId),
   * or admin.
   */
  async getPassengersByTripId(
    tripId:        string,
    requesterId:   string,
    requesterRole: string
  ): Promise<TripPassengerDTO[]> {
    const trip = await prisma.trip.findUnique({
      where:  { id: tripId },
      select: {
        driverId: true,
        operator: { select: { user: { select: { id: true } } } },
      },
    });
    if (!trip) throw new NotFoundError("Trip not found");

    const isOwner  = trip.operator?.user?.id === requesterId;
    const isDriver = requesterRole === "driver" && trip.driverId === requesterId;
    const isAdmin  = requesterRole === "admin";

    if (!isOwner && !isDriver && !isAdmin) {
      throw new ForbiddenError("You do not have access to this trip's passenger list");
    }

    return bookingsRepository.findPassengersByTripId(tripId);
  },

  /** Look up a booking by its payment reference (used by payments module). */
  async getByPaymentRef(paymentRef: string): Promise<BookingDTO | null> {
    return bookingsRepository.findByPaymentRef(paymentRef);
  },

  /**
   * The seat IDs this user currently holds for a trip — verified against the DB
   * (not Redis) so payment init survives a Redis outage during the hold phase.
   */
  async getHeldSeatIds(tripId: string, userId: string): Promise<string[]> {
    return inventoryService.heldSeatIds(tripId, userId);
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

