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

/**
 * Poll backend for the booking created by the Paystack webhook.
 * Returns `null` if the webhook hasn't fired yet (202 Accepted),
 * or `{ booking }` when confirmed.
 */
export async function verifyPayment(
  reference: string
): Promise<{ booking: Booking } | null> {
  const result = await api.get<
    { booking: Booking } | { status: "pending" },
    { booking: Booking } | { status: "pending" }
  >(`/payments/verify/${encodeURIComponent(reference)}`);

  if ("status" in result && result.status === "pending") return null;
  return result as { booking: Booking };
}
