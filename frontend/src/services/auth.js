import api from '@/lib/api';

/**
 * Log in with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string }>}
 */
export async function login(email, password) {
  return api.post('/auth/login', { email, password });
}

/**
 * Register a new passenger account.
 * @param {{ fullName: string, email: string, phone: string, password: string }} payload
 * @returns {Promise<{ token: string }>}
 */
export async function register(payload) {
  return api.post('/auth/register', payload);
}
