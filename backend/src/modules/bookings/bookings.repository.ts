/**
 * Bookings + BookedSeats data access — the ONLY place that touches the
 * `bookings` and `booked_seats` tables.
 *
 * confirmSeats uses raw SELECT … FOR UPDATE so concurrent transactions
 * serialise at the database level — this is what prevents double-booking.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { ConflictError } from "../../shared/errors";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";

type Tx = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// DTO types
// ---------------------------------------------------------------------------
export interface BookedSeatDTO {
  id:    string;
  label: string;
}

export interface BookingDTO {
  id:          string;
  userId:      string;
  tripId:      string;
  status:      string;
  totalAmount: number;
  paymentRef:  string | null;
  seats:       BookedSeatDTO[];
  createdAt:   string;
}

// ---------------------------------------------------------------------------
// Shared Prisma include
// ---------------------------------------------------------------------------
const BOOKING_WITH_SEATS = {
  seats: { include: { seat: { select: { label: true } } } },
} satisfies Prisma.BookingInclude;

function toDTO(raw: {
  id: string;
  userId: string;
  tripId: string;
  status: string;
  totalAmount: number;
  paymentRef: string | null;
  createdAt: Date;
  seats: Array<{ id: string; seat: { label: string } }>;
}): BookingDTO {
  return {
    id:          raw.id,
    userId:      raw.userId,
    tripId:      raw.tripId,
    status:      raw.status,
    totalAmount: raw.totalAmount,
    paymentRef:  raw.paymentRef,
    createdAt:   raw.createdAt.toISOString(),
    seats: raw.seats.map((bs) => ({ id: bs.id, label: bs.seat.label })),
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
export const bookingsRepository = {
  /**
   * Atomically transition available → held for the requested seats, stamping
   * heldUntil so the sweeper can reclaim the hold if its expiry job is lost.
   * Returns the count of rows updated. If count < seatIds.length, at least one
   * seat was no longer available; the caller's transaction will roll back.
   */
  async holdSeats(tripId: string, seatIds: string[], heldUntil: Date, tx: Tx): Promise<number> {
    const result = await tx.seat.updateMany({
      where: { id: { in: seatIds }, tripId, status: "available" },
      data:  { status: "held", heldUntil },
    });
    return result.count;
  },

  /**
   * Safety net: reclaim seats stuck in 'held' past their expiry. Independent of
   * the per-hold BullMQ job and Redis, so an orphaned hold (job never enqueued,
   * process crashed mid-hold, Redis flushed) is still released. Idempotent.
   * Returns the number of seats reclaimed.
   */
  async releaseExpiredHolds(now: Date): Promise<number> {
    const result = await prisma.seat.updateMany({
      where: { status: "held", heldUntil: { lt: now } },
      data:  { status: "available", heldUntil: null },
    });
    return result.count;
  },

  /**
   * Core confirm — must run inside a caller-supplied transaction.
   *
   * 1. SELECT … FOR UPDATE acquires row locks so concurrent confirms
   *    for the same seats serialise here (one waits while the other runs).
   * 2. If fewer rows are locked than requested, at least one seat was taken.
   * 3. Bulk-update to 'booked' + create the Booking + BookedSeats rows.
   */
  async confirmSeats(
    tripId:      string,
    seatIds:     string[],
    bookingData: { userId: string; totalAmount: number; paymentRef: string },
    tx:          Tx
  ): Promise<BookingDTO> {
    // Lock only the rows whose status is still confirmable.
    // Using Prisma.join gives safe parameterised IN-list — no injection risk.
    // NOTE: the column is "tripId" (camelCase) — Prisma maps the model field to
    // an unquoted-camelCase Postgres column since Seat.tripId has no @map, and
    // both id/tripId are `text`, so no ::uuid cast (that would error text = uuid).
    const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM seats
      WHERE  "tripId" = ${tripId}
      AND    id IN (${Prisma.join(seatIds)})
      AND    status IN ('held', 'available')
      FOR UPDATE
    `;

    if (lockedRows.length < seatIds.length) {
      throw new ConflictError("One or more seats are no longer available");
    }

    // Transition to booked; clear heldUntil so the sweeper never touches it.
    await tx.seat.updateMany({
      where: { id: { in: seatIds } },
      data:  { status: "booked", heldUntil: null },
    });

    // Create the booking + seat junction records
    const booking = await tx.booking.create({
      data: {
        userId:      bookingData.userId,
        tripId,
        status:      "confirmed",
        totalAmount: bookingData.totalAmount,
        paymentRef:  bookingData.paymentRef,
        seats: {
          createMany: {
            data: seatIds.map((seatId) => ({ seatId })),
          },
        },
      },
      include: BOOKING_WITH_SEATS,
    });

    return toDTO(booking as Parameters<typeof toDTO>[0]);
  },

  /**
   * Trip status — for the hold pre-check. Cross-table read: the trips module owns
   * the `trips` table (writes), but reads are allowed across modules.
   */
  async findTripStatus(tripId: string): Promise<string | null> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { status: true } });
    return trip?.status ?? null;
  },

  /** Trip price — for computing the booking total at confirm time. */
  async findTripPrice(tripId: string): Promise<number | null> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { price: true } });
    return trip?.price ?? null;
  },

  /** How many of seatIds actually belong to tripId — guards cross-trip seat injection. */
  countTripSeats(tripId: string, seatIds: string[]): Promise<number> {
    return prisma.seat.count({ where: { id: { in: seatIds }, tripId } });
  },

  /** A page of all bookings, newest first (admin view). */
  async findAll(pagination: PaginationQuery): Promise<Page<BookingDTO>> {
    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        include: BOOKING_WITH_SEATS,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(pagination),
      }),
      prisma.booking.count(),
    ]);
    return {
      items: bookings.map((b) => toDTO(b as Parameters<typeof toDTO>[0])),
      total,
    };
  },

  /** Check for an existing booking by paymentRef (idempotency). */
  async findByPaymentRef(paymentRef: string): Promise<BookingDTO | null> {
    const booking = await prisma.booking.findUnique({
      where:   { paymentRef },
      include: BOOKING_WITH_SEATS,
    });
    return booking ? toDTO(booking as Parameters<typeof toDTO>[0]) : null;
  },

  /** A page of the passenger's own booking history, newest first. */
  async findByUser(userId: string, pagination: PaginationQuery): Promise<Page<BookingDTO>> {
    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where:   { userId },
        include: BOOKING_WITH_SEATS,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(pagination),
      }),
      prisma.booking.count({ where: { userId } }),
    ]);
    return {
      items: bookings.map((b) => toDTO(b as Parameters<typeof toDTO>[0])),
      total,
    };
  },

  /** Full booking detail — owner or admin only (caller enforces access). */
  async findById(id: string): Promise<BookingDTO | null> {
    const booking = await prisma.booking.findUnique({
      where:   { id },
      include: BOOKING_WITH_SEATS,
    });
    return booking ? toDTO(booking as Parameters<typeof toDTO>[0]) : null;
  },
};
