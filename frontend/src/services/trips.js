import api from '@/lib/api';

/**
 * Search available trips by route, date, and passengers.
 * @param {{ from: string, to: string, date: string, passengers: string }} params
 * @returns {Promise<Array>}
 */
export async function searchTrips(params) {
  return api.get('/trips/search', { params });
}

/**
 * Fetch a single trip by ID (includes seat map).
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchTrip(id) {
  return api.get(`/trips/${id}`);
}
