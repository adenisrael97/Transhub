import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Trip, Passenger, PaymentMethodId } from "@/types";

/**
 * Booking flow store — holds the selected trip, the number of seats being booked,
 * passenger details, payment method, and the active hold metadata.
 * Seatless model: the passenger books a QUANTITY of seats, not specific labels.
 *
 * Persisted to sessionStorage (NOT localStorage): an accidental refresh mid-
 * checkout must not drop the passenger back to 1 seat / no hold, but the booking
 * context should still die with the tab — it is meaningless once the hold's TTL
 * lapses and must never bleed into a future session.
 */
interface BookingState {
  selectedTrip: Trip | null;
  quantity: number;
  passengers: Passenger[];
  paymentMethod: PaymentMethodId;

  // Set by holdSeats() before navigating to /checkout
  holdId:    string | null;
  expiresAt: string | null; // ISO-8601

  // Set after the Paystack verify poll resolves the confirmed booking
  confirmedBookingRef: string | null;

  setTrip: (trip: Trip) => void;
  setQuantity: (quantity: number) => void;
  setPassengers: (passengers: Passenger[]) => void;
  setPaymentMethod: (method: PaymentMethodId) => void;
  setHold: (holdId: string, ttlSeconds: number) => void;
  setConfirmedRef: (ref: string) => void;
  clearBooking: () => void;
  getTotalAmount: () => number;
}

const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
  selectedTrip: null,
  quantity: 1,
  passengers: [],
  paymentMethod: "card",
  holdId: null,
  expiresAt: null,
  confirmedBookingRef: null,

  setTrip(trip) {
    set({ selectedTrip: trip, quantity: 1, passengers: [], holdId: null, expiresAt: null });
  },

  setQuantity(quantity) {
    set({ quantity });
  },

  setPassengers(passengers) {
    set({ passengers });
  },

  setPaymentMethod(method) {
    set({ paymentMethod: method });
  },

  setHold(holdId, ttlSeconds) {
    // Derive the deadline from the server's RELATIVE ttl using the CLIENT clock.
    // Both the deadline and the countdown's "now" then come from the same clock,
    // so a skewed device clock can't make the timer disagree with the real hold
    // window (which is what produced confusing 409s on payment submit).
    set({ holdId, expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString() });
  },

  setConfirmedRef(ref) {
    set({ confirmedBookingRef: ref });
  },

  clearBooking() {
    set({
      selectedTrip: null,
      quantity: 1,
      passengers: [],
      paymentMethod: "card",
      holdId: null,
      expiresAt: null,
      confirmedBookingRef: null,
    });
  },

  getTotalAmount() {
    const { selectedTrip, quantity } = get();
    return selectedTrip ? quantity * (selectedTrip.price ?? 0) : 0;
  },
    }),
    {
      name: "transhub-booking",
      // sessionStorage on the client; a no-op on the server (SSR) so persist
      // skips rehydration there instead of throwing on a missing global.
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.sessionStorage : (undefined as unknown as Storage)
      ),
      // Persist only the in-flight booking context — never the transient
      // confirmed ref (that belongs to a completed flow).
      partialize: (s) => ({
        selectedTrip:  s.selectedTrip,
        quantity:      s.quantity,
        passengers:    s.passengers,
        paymentMethod: s.paymentMethod,
        holdId:        s.holdId,
        expiresAt:     s.expiresAt,
      }),
    }
  )
);

export default useBookingStore;
