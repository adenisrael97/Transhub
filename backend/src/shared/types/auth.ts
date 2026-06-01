/**
 * Identity types shared across modules and middleware.
 * Kept in shared/ (not inside the auth module) so both `auth` and `users`
 * can import them without creating a module-to-module cycle.
 */

/** Application roles. Lowercase to match the frontend's Role union exactly. */
export type Role = "passenger" | "operator" | "admin" | "driver";

/** The authenticated identity carried in the JWT and attached to req.user. */
export interface AuthUser {
  id: string;
  /** Absent for role === "driver" — drivers authenticate by phone only. */
  email?: string;
  fullName: string;
  phone: string;
  role: Role;
  /** Present for role === "operator" and role === "driver". */
  operatorId?: string;
}
