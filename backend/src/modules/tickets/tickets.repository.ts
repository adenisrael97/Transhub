/**
 * Tickets data access — READ-ONLY. This module owns no tables and writes nothing.
 * It composes a passenger-facing ticket view from the bookings, trips, and users
 * tables (all read via the shared schema; the table-ownership rule only restricts
 * writers, not readers).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";

export interface TicketDTO {
  bookingId:      string;
  paymentRef:     string;
  status:         string;
  passengerName:  string;
  passengerPhone: string;
  from:           string;
  to:             string;
  departureTime:  string;        // ISO string
  arrivalTime:    string | null;
  operator:       string;        // companyName
  vehicleType:    string;
  seatCount:      number;        // open seating — number of seats booked, not labels
  totalAmount:    number;        // naira
  bookedAt:       string;        // ISO string (booking.createdAt)
}

export interface TicketSummaryDTO {
  bookingId:     string;
  paymentRef:    string;
  status:        string;
  from:          string;
  to:            string;
  departureTime: string;
  seatCount:     number;
  totalAmount:   number;
  bookedAt:      string;
}

// Full ticket: trip + operator name, passenger contact, booked-seat count.
const TICKET_FULL = {
  trip:   { include: { operator: { select: { companyName: true } } } },
  user:   { select: { fullName: true, phone: true } },
  _count: { select: { seats: true } },
} satisfies Prisma.BookingInclude;

// Lighter shape for the list page — no operator/passenger detail needed.
const TICKET_SUMMARY = {
  trip:   { select: { from: true, to: true, departureTime: true } },
  _count: { select: { seats: true } },
} satisfies Prisma.BookingInclude;

export const ticketsRepository = {
  /** A page of confirmed bookings for this passenger, newest first, optional search. */
  async findByUser(userId: string, search: string | undefined, pagination: PaginationQuery): Promise<Page<TicketSummaryDTO>> {
    const where: Prisma.BookingWhereInput = {
      userId,
      status: "confirmed",
      ...(search
        ? {
            OR: [
              { paymentRef: { contains: search, mode: "insensitive" } },
              { trip: { from: { contains: search, mode: "insensitive" } } },
              { trip: { to:   { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: TICKET_SUMMARY,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(pagination),
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      items: bookings.map((b) => ({
        bookingId:     b.id,
        paymentRef:    b.paymentRef ?? "",
        status:        b.status,
        from:          b.trip.from,
        to:            b.trip.to,
        departureTime: b.trip.departureTime.toISOString(),
        seatCount:     b._count.seats,
        totalAmount:   b.totalAmount,
        bookedAt:      b.createdAt.toISOString(),
      })),
      total,
    };
  },

  /**
   * Single ticket, with an ownership check baked in: a booking that doesn't
   * exist OR belongs to another user both return null (no 403 leak — the
   * service turns null into a 404 either way).
   */
  async findById(bookingId: string, userId: string): Promise<TicketDTO | null> {
    const b = await prisma.booking.findUnique({
      where:   { id: bookingId },
      include: TICKET_FULL,
    });

    if (!b || b.userId !== userId) return null;

    return {
      bookingId:      b.id,
      paymentRef:     b.paymentRef ?? "",
      status:         b.status,
      passengerName:  b.user.fullName,
      passengerPhone: b.user.phone,
      from:           b.trip.from,
      to:             b.trip.to,
      departureTime:  b.trip.departureTime.toISOString(),
      arrivalTime:    b.trip.arrivalTime ? b.trip.arrivalTime.toISOString() : null,
      operator:       b.trip.operator.companyName,
      vehicleType:    b.trip.vehicleType,
      seatCount:      b._count.seats,
      totalAmount:    b.totalAmount,
      bookedAt:       b.createdAt.toISOString(),
    };
  },
};
