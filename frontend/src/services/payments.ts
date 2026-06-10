import api from "@/lib/api";
import type { Booking } from "@/types";

export interface InitializeResult {
  authorizationUrl: string;
  reference:        string;
}

export interface PassengerPayload {
  fullName:       string;
  phone:          string;
  email?:         string;
  nextOfKinName:  string;
  nextOfKinPhone: string;
  specialNeeds?:  string;
}

/** Call backend to create a Paystack transaction for the caller's held seats.
 *  The server resolves which seats this user holds (and the amount) — the client
 *  sends the trip and passenger details for persistence after payment confirmation. */
export function initializePayment(
  tripId:     string,
  passengers: PassengerPayload[]
): Promise<InitializeResult> {
  return api.post<InitializeResult, InitializeResult>("/payments/initialize", { tripId, passengers });
}

export type VerifyResult =
  | { state: "success"; booking: Booking }
  | { state: "pending" }
  | { state: "failed"; reason: string };

/**
 * Ask the backend to resolve a payment after the Paystack redirect.
 * The backend first checks for a webhook-confirmed booking, then falls back to
 * Paystack's verify API — so this distinguishes a confirmed payment, one still
 * in flight (keep polling), and a definite failure/cancellation (offer a retry).
 */
export async function verifyPayment(reference: string): Promise<VerifyResult> {
  const result = await api.get<
    { booking: Booking } | { status: "pending" } | { status: "failed"; reason?: string },
    { booking: Booking } | { status: "pending" } | { status: "failed"; reason?: string }
  >(`/payments/verify/${encodeURIComponent(reference)}`);

  if ("booking" in result) return { state: "success", booking: result.booking };
  if ("status" in result && result.status === "failed") {
    return { state: "failed", reason: result.reason ?? "Your payment could not be completed." };
  }
  return { state: "pending" };
}
