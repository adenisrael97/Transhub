import api from "@/lib/api";
import type { HoldResult, Booking, PageMeta, ListParams } from "@/types";

/** Phase A — Hold N seats before payment. Returns hold metadata incl. expiry. */
export function holdSeats(
  tripId:   string,
  quantity: number
): Promise<HoldResult> {
  return api.post<HoldResult, HoldResult>("/bookings/hold", { tripId, quantity });
}

// Phase B — Confirm is server-side only: the backend confirms a booking from the
// verified Paystack webhook. The client just polls /payments/verify/:ref (see
// services/payments.ts) — there is no client-callable confirm.

export interface BookingsEnvelope { bookings: Booking[]; pagination?: PageMeta }

/**
 * Bookings list (server-side paginated/filtered/searchable). Role-scoped on the
 * backend: passenger → own; admin → all; operator → their trips.
 * Supported params: page, limit, status, operatorId, minAmount, maxAmount,
 * dateFrom, dateTo, search.
 */
export function fetchBookings(params?: ListParams): Promise<BookingsEnvelope> {
  return api.get<BookingsEnvelope, BookingsEnvelope>("/bookings", { params });
}

/** Single booking detail. */
export function fetchBooking(id: string): Promise<{ booking: Booking }> {
  return api.get<{ booking: Booking }, { booking: Booking }>(`/bookings/${id}`);
}
