/**
 * Token helpers — read/write/clear JWT from localStorage.
 * getUser() decodes the token and checks expiry.
 * All functions are SSR-safe (no-op when window is undefined).
 */
import { jwtDecode } from "jwt-decode";
import type { User } from "@/types";

const KEY = "transhub_token";

export const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem(KEY) : null;

export const setToken = (token: string): void => {
  if (typeof window !== "undefined") localStorage.setItem(KEY, token);
};

export const clearToken = (): void => {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
};

/** Returns the decoded JWT payload, or null if missing/expired/invalid. */
export function getUser(): User | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<User>(token);
    // Treat a token without an exp claim as invalid rather than eternal.
    if (typeof decoded.exp !== "number" || decoded.exp * 1000 < Date.now()) {
      clearToken();
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
