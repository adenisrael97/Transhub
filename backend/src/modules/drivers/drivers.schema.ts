/** Zod schemas for driver management (operator CRUD) and driver auth. */
import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";
import { searchSchema } from "../../shared/list-query";

/**
 * Driver list query.
 *  - operatorId: admin-only filter by company (ignored for operators, who are
 *                scoped to their own fleet from the JWT)
 *  - isActive:   active/deactivated filter (string "true"/"false" → boolean)
 *  - search:     full name / phone / license number
 */
export const listDriversQuerySchema = z.object({
  operatorId: z.string().uuid().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  ...searchSchema.shape,
  ...paginationQuerySchema.shape,
});

export type ListDriversQuery = z.infer<typeof listDriversQuerySchema>;

export const createDriverSchema = z.object({
  fullName:  z.string().min(2, "Full name is required"),
  phone:     z.string().min(7, "A valid phone number is required"),
  password:  z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  licenseNo: z.string().trim().optional(),
});

export const updateDriverSchema = z.object({
  fullName:  z.string().min(2).optional(),
  licenseNo: z.string().trim().optional(),
  isActive:  z.boolean().optional(),
});

export const driverLoginSchema = z.object({
  phone:    z.string().min(7, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type DriverLoginInput  = z.infer<typeof driverLoginSchema>;
