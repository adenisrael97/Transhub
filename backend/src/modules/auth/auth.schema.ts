/** Zod schemas for auth inputs. These mirror the frontend's register/login payloads. */
import { z } from "zod";

// Single source of truth for password strength — reused by register and reset
// so a password that's valid to set on signup is valid to reset to, and vice versa.
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.email("A valid email is required").transform((s) => s.trim().toLowerCase()),
  phone: z.string().min(7, "A valid phone number is required"),
  password: strongPassword,
});

export const loginSchema = z.object({
  email: z.email("A valid email is required").transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

/** Driver login: phone + password only. No email required. */
export const driverLoginSchema = z.object({
  phone:    z.string().min(7, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

/** Step 1 of password reset: request a link by email. */
export const forgotPasswordSchema = z.object({
  email: z.email("A valid email is required").transform((s) => s.trim().toLowerCase()),
});

/** Step 2 of password reset: redeem the emailed token for a new password. */
export const resetPasswordSchema = z.object({
  token:    z.string().min(1, "Reset token is required"),
  password: strongPassword,
});

export type RegisterInput       = z.infer<typeof registerSchema>;
export type LoginInput          = z.infer<typeof loginSchema>;
export type DriverLoginInput    = z.infer<typeof driverLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput  = z.infer<typeof resetPasswordSchema>;
