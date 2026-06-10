import api from "@/lib/api";
import type { User } from "@/types";

export interface AuthResponse {
  token: string;
  user?: User;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

/** Generic { message } response from the password-reset endpoints. */
export interface MessageResponse {
  message: string;
}

/** Log in with email and password. */
export function login(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse, AuthResponse>("/auth/login", { email, password });
}

/** Register a new passenger account. */
export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return api.post<AuthResponse, AuthResponse>("/auth/register", payload);
}

/** Log in as a driver using phone + password (no email required). */
export function driverLogin(phone: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse, AuthResponse>("/auth/driver/login", { phone, password });
}

/**
 * Request a password reset link. Always resolves with the same generic message
 * whether or not the email is registered (the backend never reveals which).
 */
export function forgotPassword(email: string): Promise<MessageResponse> {
  return api.post<MessageResponse, MessageResponse>("/auth/forgot-password", { email });
}

/** Redeem a reset token (from the emailed link) and set a new password. */
export function resetPassword(token: string, password: string): Promise<MessageResponse> {
  return api.post<MessageResponse, MessageResponse>("/auth/reset-password", { token, password });
}
