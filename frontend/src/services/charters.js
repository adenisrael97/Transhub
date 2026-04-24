import api from '@/lib/api';

/**
 * Submit a charter request.
 * @param {{ vehicleType: string, pickupLocation: string, destination: string, date: string, duration: string, passengers: number, purpose: string, contactName: string, contactPhone: string, contactEmail: string }} payload
 * @returns {Promise<Object>}
 */
export async function createCharter(payload) {
  return api.post('/charters', payload);
}
