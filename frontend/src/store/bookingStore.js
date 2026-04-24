import { create } from 'zustand';

/**
 * Booking flow store — holds the selected trip, chosen seats,
 * passenger details, and payment method for the checkout flow.
 * Not persisted (resets on page refresh by design).
 */
const useBookingStore = create((set, get) => ({
  selectedTrip: null,
  selectedSeats: [],
  passengers: [],      // [{ name, phone, email }]
  paymentMethod: 'card',

  setTrip(trip) {
    set({ selectedTrip: trip, selectedSeats: [], passengers: [] });
  },

  toggleSeat(seat) {
    const { selectedSeats } = get();
    const exists = selectedSeats.find((s) => s.id === seat.id);
    set({
      selectedSeats: exists
        ? selectedSeats.filter((s) => s.id !== seat.id)
        : [...selectedSeats, seat],
    });
  },

  setPassengers(passengers) {
    set({ passengers });
  },

  setPaymentMethod(method) {
    set({ paymentMethod: method });
  },

  clearBooking() {
    set({ selectedTrip: null, selectedSeats: [], passengers: [], paymentMethod: 'card' });
  },

  getTotalAmount() {
    const { selectedTrip, selectedSeats } = get();
    return selectedTrip ? selectedSeats.length * (selectedTrip.price ?? 0) : 0;
  },
}));

export default useBookingStore;
