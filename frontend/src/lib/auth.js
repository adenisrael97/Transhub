/**
 * Token helpers — read/write/clear JWT from localStorage.
 * getUser() decodes the token and checks expiry.
 * All functions are SSR-safe (no-op when window is undefined).
 */
import { jwtDecode } from 'jwt-decode';

const KEY = 'transhub_token';

export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;

export const setToken = (token) => {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, token);
};

export const clearToken = () => {
  if (typeof window !== 'undefined') localStorage.removeItem(KEY);
};

/** Returns the decoded JWT payload, or null if missing/expired. */
export function getUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      clearToken();
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
