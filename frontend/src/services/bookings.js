import api from '@/lib/api';

/**
 * Create a booking with selected trip, seats, passengers, and payment method.
 * @param {{ tripId: string, seats: Array, passengers: Array, paymentMethod: string }} payload
 * @returns {Promise<Object>}
 */
export async function createBooking(payload) {
  return api.post('/bookings', payload);
}
