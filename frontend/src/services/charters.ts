import api from "@/lib/api";
import type { CharterPayload, PageMeta, ListParams } from "@/types";

export interface CharterResult {
  id:               string;
  referenceNo:      string | null;
  vehicleType:      string;
  fromLocation:     string;
  toLocation:       string;
  departureAt:      string;
  returnAt:         string | null;
  passengerCount:   number;
  notes:            string | null;
  contactName:      string | null;
  contactPhone:     string | null;
  contactEmail:     string | null;
  // Status: pending | quote_sent | awaiting_payment | confirmed | completed | cancelled
  status:           string;
  // Quote fields (set by admin)
  quotedPrice:      string | null; // Decimal serialised as string
  operatorName:     string | null;
  operatorCost:     string | null;
  serviceFee:       string | null;
  adminNotes:       string | null;
  // Payment
  paymentRef:       string | null;
  paidAt:           string | null;
  paidAmount:       string | null;
  // Post-payment admin confirmation (shown to customer)
  assignedOperator: string | null;
  pickupInfo:       string | null;
  travelInfo:       string | null;
  completedAt:      string | null;
  createdAt:        string;
  passenger: {
    fullName: string;
    email:    string;
    phone:    string;
  };
}

export interface SendQuotePayload {
  operatorName: string;
  operatorCost: number;
  serviceFee:   number;
  quotedPrice:  number;
  adminNotes?:  string;
}

export interface ConfirmBookingPayload {
  assignedOperator: string;
  pickupInfo:       string;
  travelInfo:       string;
}

type CharterResponse  = { charter: CharterResult };
type ChartersResponse = { charters: CharterResult[]; pagination?: PageMeta };
type PayResponse      = { paymentUrl: string };

function toISO(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function createCharter(payload: CharterPayload): Promise<CharterResponse> {
  const body = {
    vehicleType:    payload.vehicleType,
    fromLocation:   payload.pickupLocation,
    toLocation:     payload.destination,
    departureAt:    toISO(payload.date),
    returnAt:       payload.duration === "round-trip" ? toISO(payload.returnDate) : undefined,
    passengerCount: payload.passengers,
    notes:          payload.purpose || undefined,
    contactName:    payload.contactName || undefined,
    contactPhone:   payload.contactPhone || undefined,
    contactEmail:   payload.contactEmail || undefined,
  };
  return api.post<CharterResponse, CharterResponse>("/charters", body);
}

/** Passenger: own charter history (paginated/filtered). Params: page, limit, status, search, dateFrom/dateTo. */
export function getMyCharters(params?: ListParams): Promise<ChartersResponse> {
  return api.get<ChartersResponse, ChartersResponse>("/charters/me", { params });
}

/** Admin: all charters (paginated/filtered/searchable). Same params as getMyCharters. */
export function getAllCharters(params?: ListParams): Promise<ChartersResponse> {
  return api.get<ChartersResponse, ChartersResponse>("/charters", { params });
}

/** Admin: send a full quote with operator info, pricing, and notes. */
export function sendCharterQuote(id: string, data: SendQuotePayload): Promise<CharterResponse> {
  return api.patch<CharterResponse, CharterResponse>(`/charters/${id}/quote`, data);
}

/** Passenger: accept a quote → status becomes awaiting_payment. */
export function acceptCharterQuote(id: string): Promise<CharterResponse> {
  return api.patch<CharterResponse, CharterResponse>(`/charters/${id}/accept`, {});
}

/** Passenger: reject a quote → status becomes cancelled. */
export function rejectCharterQuote(id: string): Promise<CharterResponse> {
  return api.patch<CharterResponse, CharterResponse>(`/charters/${id}/reject`, {});
}

/** Passenger: initiate Paystack payment for an accepted charter. */
export function initiateCharterPayment(id: string): Promise<PayResponse> {
  return api.post<PayResponse, PayResponse>(`/charters/${id}/pay`, {});
}

export interface VerifyCharterResult {
  state:   "success" | "pending" | "failed";
  charter: CharterResult;
}

/**
 * Passenger: verify a charter payment after returning from Paystack.
 * Webhook-independent — confirms via Paystack's verify API if the webhook hasn't
 * landed yet, and distinguishes success / still-pending / failed-or-cancelled.
 */
export function verifyCharterPayment(id: string): Promise<VerifyCharterResult> {
  return api.post<VerifyCharterResult, VerifyCharterResult>(`/charters/${id}/verify-payment`, {});
}

/** Admin: update booking details post-payment (operator, pickup, travel info). */
export function adminConfirmBooking(id: string, data: ConfirmBookingPayload): Promise<CharterResponse> {
  return api.patch<CharterResponse, CharterResponse>(`/charters/${id}/confirm-booking`, data);
}

/** Admin: mark charter as completed after travel date. */
export function completeCharter(id: string): Promise<CharterResponse> {
  return api.patch<CharterResponse, CharterResponse>(`/charters/${id}/complete`, {});
}

/** Passenger or admin: cancel a pending/quote_sent/awaiting_payment charter. */
export function cancelCharter(id: string): Promise<CharterResponse> {
  return api.delete<CharterResponse, CharterResponse>(`/charters/${id}`);
}
