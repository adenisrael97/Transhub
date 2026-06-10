import api from "@/lib/api";
import type { User, AdminUser, PageMeta, ListParams } from "@/types";

export interface AdminUsersEnvelope { users: AdminUser[]; pagination?: PageMeta }

/**
 * Admin user/customer directory — server-side paginated/filtered/searchable.
 * Params: page, limit, role (passenger for the Customers tab), search, dateFrom/dateTo.
 */
export function fetchUsers(params?: ListParams): Promise<AdminUsersEnvelope> {
  return api.get<AdminUsersEnvelope, AdminUsersEnvelope>("/users", { params });
}

/** Fields the signed-in user can edit about their own account. All optional —
 *  send only what changed. Mirrors the backend updateProfileSchema. */
export interface UpdateProfilePayload {
  name?:  string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword:     string;
}

/** Backend envelopes */
interface ProfileResponse { user: User }
/** PATCH /users/me returns a freshly-signed token alongside the updated user —
 *  the old JWT's embedded name/email/phone are now stale. */
interface UpdateProfileResponse { user: User; token: string }
interface MessageResponse { message: string }

/** Fetch the signed-in user's profile, fresh from the DB (network-only). */
export function getMe(): Promise<ProfileResponse> {
  return api.get<ProfileResponse, ProfileResponse>("/users/me");
}

/** Update the signed-in user's profile. Returns the updated user + new token. */
export function updateProfile(
  payload: UpdateProfilePayload
): Promise<UpdateProfileResponse> {
  return api.patch<UpdateProfileResponse, UpdateProfileResponse>("/users/me", payload);
}

/** Change the signed-in user's password (requires the current password). */
export function changePassword(
  payload: ChangePasswordPayload
): Promise<MessageResponse> {
  return api.patch<MessageResponse, MessageResponse>("/users/me/password", payload);
}
