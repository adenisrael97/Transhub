/** Zod schemas for auth inputs. These mirror the frontend's register/login payloads. */
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  // Normalize email: trim whitespace and lowercase so "User@EXAMPLE.COM" and
  // "user@example.com" are treated as the same account everywhere.
  email: z.email("A valid email is required").transform((s) => s.trim().toLowerCase()),
  phone: z.string().min(7, "A valid phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.email("A valid email is required").transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
