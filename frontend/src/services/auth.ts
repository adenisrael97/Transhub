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
