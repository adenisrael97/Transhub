/** Zod schemas for auth inputs. These mirror the frontend's register/login payloads. */
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.email("A valid email is required").transform((s) => s.trim().toLowerCase()),
  phone: z.string().min(7, "A valid phone number is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
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

export type RegisterInput    = z.infer<typeof registerSchema>;
export type LoginInput       = z.infer<typeof loginSchema>;
export type DriverLoginInput = z.infer<typeof driverLoginSchema>;
