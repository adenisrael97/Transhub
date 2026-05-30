/**
 * Bookings + BookedSeats data access — the ONLY place that touches the
 * `bookings`, `booked_seats`, and `passenger_info` tables.
 *
 * confirmSeats uses raw SELECT … FOR UPDATE so concurrent transactions
 * serialise at the database level — this is what prevents double-booking.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { ConflictError } from "../../shared/errors";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";
import type { PassengerInfoInput } from "./bookings.schema";

type Tx = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// DTO types
// ---------------------------------------------------------------------------
export interface BookedSeatDTO {
  id:    string;
  label: string;
}

export interface PassengerInfoDTO {
  id:             string;
  fullName:       string;
  phone:          string;
  email:          string | null;
  nextOfKinName:  string;
  nextOfKinPhone: string;
  specialNeeds:   string | null;
}

export interface BookingDTO {
  id:          string;
  userId:      string;
  tripId:      string;
  status:      string;
  totalAmount: number;
  paymentRef:  string | null;
  seats:       BookedSeatDTO[];
  passengers:  PassengerInfoDTO[];
  trip: {
    from:          string;
    to:            string;
    departureTime: string;
    vehicleType:   string;
    parkName:      string | null;
  } | null;
  createdAt:   string;
}

/** Passenger list for a specific trip (driver / operator view). */
export interface TripPassengerDTO {
  bookingId:  string;
  seatCount:  number;
  status:     string;
  passengers: PassengerInfoDTO[];
}

// ---------------------------------------------------------------------------
// Shared Prisma include
// ---------------------------------------------------------------------------
const BOOKING_WITH_ALL = {
  seats:      { include: { seat: { select: { label: true } } } },
  passengers: true,
  trip: {
    select: {
      from:          true,
      to:            true,
      departureTime: true,
      vehicleType:   true,
      parkName:      true,
    },
  },
} satisfies Prisma.BookingInclude;

type RawBooking = Prisma.BookingGetPayload<{ include: typeof BOOKING_WITH_ALL }>;

function toDTO(raw: RawBooking): BookingDTO {
  return {
    id:          raw.id,
    userId:      raw.userId,
    tripId:      raw.tripId,
    status:      raw.status,
    totalAmount: raw.totalAmount,
    paymentRef:  raw.paymentRef,
    createdAt:   raw.createdAt.toISOString(),
    seats: raw.seats.map((bs) => ({ id: bs.id, label: bs.seat.label })),
    passengers: (raw.passengers ?? []).map((p) => ({
      id:             p.id,
      fullName:       p.fullName,
      phone:          p.phone,
      email:          p.email,
      nextOfKinName:  p.nextOfKinName,
      nextOfKinPhone: p.nextOfKinPhone,
      specialNeeds:   p.specialNeeds,
    })),
    trip: raw.trip
      ? {
          from:          raw.trip.from,
          to:            raw.trip.to,
          departureTime: raw.trip.departureTime.toISOString(),
          vehicleType:   raw.trip.vehicleType,
          parkName:      raw.trip.parkName,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
export const bookingsRepository = {
  /**
   * Atomically claim up to `quantity` available seat-slots for this trip and
   * transition them available → held, stamping heldUntil/heldBy.
   *
   * Seatless model: the passenger asks for a COUNT, not specific labels, so the
   * server picks any free rows. `FOR UPDATE SKIP LOCKED` is what makes this
   * race-free: two concurrent claims each lock a DISJOINT set of rows (the loser
   * skips the rows the winner just locked instead of blocking on them), so total
   * holds can never exceed capacity — no oversell. Returns the claimed seat IDs;
   * if fewer than `quantity` come back the trip is (nearly) full and the caller
   * rolls back with a 409.
   */
  async claimAvailableSeats(
    tripId: string,
    quantity: number,
    userId: string,
    heldUntil: Date,
    tx: Tx
  ): Promise<string[]> {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM seats
      WHERE  "tripId" = ${tripId} AND status = 'available'
      ORDER BY label
      LIMIT  ${quantity}
      FOR UPDATE SKIP LOCKED
    `;
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    await tx.seat.updateMany({
      where: { id: { in: ids } },
      data:  { status: "held", heldUntil, heldBy: userId },
    });
    return ids;
  },

  /**
   * The seat IDs this user currently holds for a trip — the authoritative set
   * used by payment initialization to compute the amount and build the webhook
   * metadata. Reads the DB (not Redis): a seat counts only if still 'held',
   * stamped with this userId, and not past its expiry.
   */
  async idsHeldBy(tripId: string, userId: string, now: Date): Promise<string[]> {
    const rows = await prisma.seat.findMany({
      where:  { tripId, status: "held", heldBy: userId, heldUntil: { gt: now } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  },

  /**
   * Safety net: reclaim seats stuck in 'held' past their expiry.
   */
  async releaseExpiredHolds(now: Date): Promise<number> {
    const result = await prisma.seat.updateMany({
      where: { status: "held", heldUntil: { lt: now } },
      data:  { status: "available", heldUntil: null, heldBy: null },
    });
    return result.count;
  },

  /**
   * Core confirm — must run inside a caller-supplied transaction.
   *
   * 1. SELECT … FOR UPDATE acquires row locks so concurrent confirms
   *    for the same seats serialise here (one waits while the other runs).
   * 2. If fewer rows are locked than requested, at least one seat was taken.
   * 3. Bulk-update to 'booked' + create the Booking + BookedSeats + PassengerInfo rows.
   */
  async confirmSeats(
    tripId:      string,
    seatIds:     string[],
    bookingData: { userId: string; totalAmount: number; paymentRef: string; passengers?: PassengerInfoInput[] },
    tx:          Tx
  ): Promise<BookingDTO> {
    const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM seats
      WHERE  "tripId" = ${tripId}
      AND    id IN (${Prisma.join(seatIds)})
      AND    (status = 'available' OR (status = 'held' AND "heldBy" = ${bookingData.userId}))
      FOR UPDATE
    `;

    if (lockedRows.length < seatIds.length) {
      throw new ConflictError("One or more seats are no longer available");
    }

    await tx.seat.updateMany({
      where: { id: { in: seatIds } },
      data:  { status: "booked", heldUntil: null, heldBy: null },
    });

    const booking = await tx.booking.create({
      data: {
        userId:      bookingData.userId,
        tripId,
        status:      "confirmed",
        totalAmount: bookingData.totalAmount,
        paymentRef:  bookingData.paymentRef,
        seats: {
          createMany: { data: seatIds.map((seatId) => ({ seatId })) },
        },
        ...(bookingData.passengers?.length
          ? {
              passengers: {
                createMany: {
                  data: bookingData.passengers.map((p) => ({
                    fullName:       p.fullName,
                    phone:          p.phone,
                    email:          p.email ?? null,
                    nextOfKinName:  p.nextOfKinName,
                    nextOfKinPhone: p.nextOfKinPhone,
                    specialNeeds:   p.specialNeeds ?? null,
                  })),
                },
              },
            }
          : {}),
      },
      include: BOOKING_WITH_ALL,
    });

    return toDTO(booking);
  },

  /** Trip booking state — for the hold pre-check. */
  async findTripBookingState(
    tripId: string
  ): Promise<{ status: string; isActive: boolean; isFull: boolean } | null> {
    const trip = await prisma.trip.findUnique({
      where:  { id: tripId },
      select: { status: true, isActive: true, isFull: true },
    });
    return trip ?? null;
  },

  /** Trip price — for computing the booking total at confirm time. */
  async findTripPrice(tripId: string): Promise<number | null> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { price: true } });
    return trip?.price ?? null;
  },

  /** A page of all bookings, newest first (admin view). */
  async findAll(pagination: PaginationQuery): Promise<Page<BookingDTO>> {
    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        include: BOOKING_WITH_ALL,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(pagination),
      }),
      prisma.booking.count(),
    ]);
    return { items: bookings.map(toDTO), total };
  },

  /**
   * All bookings for trips owned by the given operator, newest first.
   * Used by the operator bookings dashboard.
   */
  async findByOperator(operatorId: string, pagination: PaginationQuery): Promise<Page<BookingDTO>> {
    const where = { trip: { operatorId } };
    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: BOOKING_WITH_ALL,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(pagination),
      }),
      prisma.booking.count({ where }),
    ]);
    return { items: bookings.map(toDTO), total };
  },

  /** Check for an existing booking by paymentRef (idempotency). */
  async findByPaymentRef(paymentRef: string): Promise<BookingDTO | null> {
    const booking = await prisma.booking.findUnique({
      where:   { paymentRef },
      include: BOOKING_WITH_ALL,
    });
    return booking ? toDTO(booking) : null;
  },

  /** A page of the passenger's own booking history, newest first. */
  async findByUser(userId: string, pagination: PaginationQuery): Promise<Page<BookingDTO>> {
    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where:   { userId },
        include: BOOKING_WITH_ALL,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(pagination),
      }),
      prisma.booking.count({ where: { userId } }),
    ]);
    return { items: bookings.map(toDTO), total };
  },

  /** Full booking detail — owner or admin only (caller enforces access). */
  async findById(id: string): Promise<BookingDTO | null> {
    const booking = await prisma.booking.findUnique({
      where:   { id },
      include: BOOKING_WITH_ALL,
    });
    return booking ? toDTO(booking) : null;
  },

  /**
   * All confirmed/pending bookings for a trip, with passenger details.
   * Used by the driver dashboard and operator route view.
   */
  async findPassengersByTripId(tripId: string): Promise<TripPassengerDTO[]> {
    const bookings = await prisma.booking.findMany({
      where:   { tripId, status: { in: ["confirmed", "pending"] } },
      include: {
        seats:      { include: { seat: { select: { label: true } } } },
        passengers: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return bookings.map((b) => ({
      bookingId: b.id,
      seatCount: b.seats.length,
      status:    b.status,
      passengers: b.passengers.map((p) => ({
        id:             p.id,
        fullName:       p.fullName,
        phone:          p.phone,
        email:          p.email,
        nextOfKinName:  p.nextOfKinName,
        nextOfKinPhone: p.nextOfKinPhone,
        specialNeeds:   p.specialNeeds,
      })),
    }));
  },
};
