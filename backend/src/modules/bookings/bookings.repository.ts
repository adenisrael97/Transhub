/**
 * Bookings data access — the ONLY place that touches the `bookings`,
 * `booked_seats`, and `passenger_info` tables.
 *
 * Seat-level operations (hold, lock, release) have moved to the inventory
 * module which is the sole owner of the `seats` table.
 */
import { Prisma, type BookingStatus } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";
import { toDateRange, toNumberRange } from "../../shared/list-query";
import type { PassengerInfoInput } from "./bookings.schema";

/** Admin/operator booking list filters (see listBookingsQuerySchema). */
export interface BookingListFilter {
  status?:     string;
  operatorId?: string;
  minAmount?:  number;
  maxAmount?:  number;
  dateFrom?:   string;
  dateTo?:     string;
  search?:     string;
}

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
    operatorId:    string;
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
      operatorId:    true,
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
          operatorId:    raw.trip.operatorId,
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
// Filter → Prisma WHERE builder (shared by admin + operator list paths)
// ---------------------------------------------------------------------------
/**
 * Translate a BookingListFilter into a Prisma WHERE. The `search` term is matched
 * (case-insensitive) against booking id / paymentRef and the related user's
 * fullName / email / phone — the spec's "Booking ID, User Name, User Email, Phone,
 * Transaction Reference" search. Booking ids are stored as text (String @id), so
 * `contains` works for prefix/substring matches of the short id shown in the UI.
 */
function buildBookingWhere(filter: BookingListFilter): Prisma.BookingWhereInput {
  const and: Prisma.BookingWhereInput[] = [];

  if (filter.status) and.push({ status: filter.status as BookingStatus });
  if (filter.operatorId) and.push({ trip: { operatorId: filter.operatorId } });

  const amount = toNumberRange(filter.minAmount, filter.maxAmount);
  if (amount) and.push({ totalAmount: amount });

  const created = toDateRange(filter.dateFrom, filter.dateTo);
  if (created) and.push({ createdAt: created });

  if (filter.search) {
    const s = filter.search;
    and.push({
      OR: [
        { id:         { contains: s, mode: "insensitive" } },
        { paymentRef: { contains: s, mode: "insensitive" } },
        { user: { fullName: { contains: s, mode: "insensitive" } } },
        { user: { email:    { contains: s, mode: "insensitive" } } },
        { user: { phone:    { contains: s, mode: "insensitive" } } },
        { trip: { from: { contains: s, mode: "insensitive" } } },
        { trip: { to:   { contains: s, mode: "insensitive" } } },
      ],
    });
  }

  return and.length ? { AND: and } : {};
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
export const bookingsRepository = {
  /**
   * Create a confirmed booking + BookedSeat junction rows + optional passenger
   * info. Seat locking must have already been performed by inventoryService
   * before calling this method (seats are already marked 'booked').
   * Must run inside a caller-supplied transaction.
   */
  async createBookingRecord(
    tripId:      string,
    seatIds:     string[],
    bookingData: { userId: string; totalAmount: number; paymentRef: string; passengers?: PassengerInfoInput[] },
    tx:          Tx
  ): Promise<BookingDTO> {
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

  /** A page of all bookings, newest first, with optional filters (admin view). */
  async findAll(filter: BookingListFilter, pagination: PaginationQuery): Promise<Page<BookingDTO>> {
    const where = buildBookingWhere(filter);
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

  /**
   * A page of bookings for trips owned by the given operator, newest first.
   * The operator scope is enforced here (not via the filter) so an operator can
   * never widen their view; the other filters apply within their own bookings.
   */
  async findByOperator(
    operatorId: string,
    filter: BookingListFilter,
    pagination: PaginationQuery
  ): Promise<Page<BookingDTO>> {
    // Force the operator scope; ignore any operatorId the caller put in the filter.
    const where: Prisma.BookingWhereInput = {
      AND: [{ trip: { operatorId } }, buildBookingWhere({ ...filter, operatorId: undefined })],
    };
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

  /** A page of the passenger's own booking history, newest first, with filters. */
  async findByUser(
    userId: string,
    filter: BookingListFilter,
    pagination: PaginationQuery
  ): Promise<Page<BookingDTO>> {
    const where: Prisma.BookingWhereInput = {
      AND: [{ userId }, buildBookingWhere({ ...filter, operatorId: undefined })],
    };
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

  /** Full booking detail — owner or admin only (caller enforces access). */
  async findById(id: string): Promise<BookingDTO | null> {
    const booking = await prisma.booking.findUnique({
      where:   { id },
      include: BOOKING_WITH_ALL,
    });
    return booking ? toDTO(booking) : null;
  },

  /**
   * All CONFIRMED bookings for a trip, with passenger details.
   * Used by the driver dashboard and operator route view. Deliberately excludes
   * 'pending' bookings: a driver must only board passengers who have paid.
   */
  async findPassengersByTripId(tripId: string): Promise<TripPassengerDTO[]> {
    const bookings = await prisma.booking.findMany({
      where:   { tripId, status: "confirmed" },
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
