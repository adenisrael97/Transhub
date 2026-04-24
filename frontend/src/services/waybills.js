import api from '@/lib/api';

/**
 * Fetch waybill tracking data by waybill number.
 * @param {string} waybillNo — e.g. "TH-2024-00123"
 * @returns {Promise<Object>}
 */
export async function fetchWaybill(waybillNo) {
  return api.get(`/waybills/${waybillNo}`);
}

/**
 * Create a new waybill (send goods).
 * @param {{ from: string, to: string, senderName: string, senderPhone: string, receiverName: string, receiverPhone: string, description: string, weight: string, value: string }} payload
 * @returns {Promise<{ waybillNo: string }>}
 */
export async function createWaybill(payload) {
  return api.post('/waybills', payload);
}
