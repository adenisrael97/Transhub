import api from '@/lib/api';

/**
 * Submit operator registration application.
 * @param {{ companyName: string, contactName: string, email: string, phone: string, city: string, fleetSize: string, vehicleTypes: string[], routes: string, yearsInOperation: string, cacNumber: string, additionalInfo: string }} payload
 * @returns {Promise<Object>}
 */
export async function registerOperator(payload) {
  return api.post('/operators/register', payload);
}

/**
 * Fetch all operators (admin).
 * @returns {Promise<Array>}
 */
export async function fetchOperators() {
  return api.get('/operators');
}

/**
 * Approve an operator application (admin).
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function approveOperator(id) {
  return api.patch(`/operators/${id}/approve`);
}

/**
 * Decline an operator application (admin).
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function declineOperator(id) {
  return api.patch(`/operators/${id}/decline`);
}
