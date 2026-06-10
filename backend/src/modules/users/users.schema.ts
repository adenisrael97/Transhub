import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";
import { searchSchema, dateRangeSchema } from "../../shared/list-query";

/**
 * Admin user/customer directory query.
 *  - role:   filter by a single role. The admin "Customers" tab passes
 *            role=passenger; "Users" passes none (all roles).
 *  - dateFrom/dateTo: createdAt (signup date) range.
 *  - search: full name / email / phone (case-insensitive substring).
 */
export const listUsersQuerySchema = z.object({
  role: z.enum(["passenger", "operator", "admin", "driver"]).optional(),
  ...dateRangeSchema.shape,
  ...searchSchema.shape,
  ...paginationQuerySchema.shape,
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// Same strength bar the auth module enforces on register/reset, inlined here to
// avoid a cross-module import: a password a user changes TO should meet the same
// requirements as one they could have signed up with.
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const updateProfileSchema = z
  .object({
    name:  z.string().min(2).max(100).optional(),
    // Normalize like auth does so the unique check and future logins line up.
    email: z.email("A valid email is required")
            .transform((s) => s.trim().toLowerCase())
            .optional(),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number").optional(),
  })
  // Reject an empty PATCH body outright — nothing to update is a client error,
  // not a silent no-op that returns a freshly-signed token for no reason.
  .refine((b) => b.name !== undefined || b.email !== undefined || b.phone !== undefined, {
    message: "Provide at least one field to update",
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword:     strongPassword,
});

export type UpdateProfileInput  = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
