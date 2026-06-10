/**
 * Zod validation schemas — the single source of truth for form/runtime
 * validation across the app. Types are inferred from the schemas, so the
 * form shapes and the validation rules can never drift apart.
 */
import { z } from "zod";

/** Nigerian phone: 0XXXXXXXXXX (11 digits) or +234XXXXXXXXXX. */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+?234\d{10}|0\d{10})$/, "Enter a valid Nigerian phone number");

const emailSchema = z.email("Enter a valid email address");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Please enter a name (at least 2 characters)");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Mirror the backend's strength rules (auth.schema.ts strongPassword) exactly so
// the client never accepts a password the API would 400 on.
const strongPasswordSchema = passwordSchema
  .regex(/[A-Z]/, "Add at least one uppercase letter")
  .regex(/[a-z]/, "Add at least one lowercase letter")
  .regex(/[0-9]/, "Add at least one number");

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------------------
// Account settings
// ---------------------------------------------------------------------------

// Profile edit. Mirrors backend users.updateProfileSchema: every field optional,
// but at least one must change. Phone uses the same Nigerian-format rule as
// registration so the client never sends something the API would 400 on.
export const profileUpdateSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
  });
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Change password. newPassword meets the same strength bar as registration/reset
// (and the backend's users.changePasswordSchema), and must be confirmed.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Booking / checkout
// ---------------------------------------------------------------------------

export const passengerSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: z.union([z.literal(""), emailSchema]).optional(),
  nextOfKinName: nameSchema.describe("Next of kin full name"),
  nextOfKinPhone: phoneSchema.describe("Next of kin phone number"),
  specialNeeds: z.string().trim().max(200).optional(),
});
export type PassengerInput = z.infer<typeof passengerSchema>;

export const checkoutSchema = z.object({
  passengers: z.array(passengerSchema).min(1, "At least one passenger is required"),
  paymentMethod: z.enum(["card", "transfer", "ussd"]),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ---------------------------------------------------------------------------
// Trip search
// ---------------------------------------------------------------------------

export const tripSearchSchema = z
  .object({
    from: z.string().min(1, "Select an origin"),
    to: z.string().min(1, "Select a destination"),
    date: z.string().min(1, "Select a date"),
    passengers: z.string(),
  })
  .refine((d) => d.from !== d.to, {
    message: "Origin and destination must differ",
    path: ["to"],
  });
export type TripSearchInput = z.infer<typeof tripSearchSchema>;

// ---------------------------------------------------------------------------
// Charter
// ---------------------------------------------------------------------------

export const charterSchema = z.object({
  vehicleType: z.string().min(1, "Select a vehicle type"),
  pickupLocation: z.string().min(1, "Enter a pickup location"),
  destination: z.string().min(1, "Enter a destination"),
  date: z.string().min(1, "Select a date"),
  passengers: z.coerce.number().int().min(1, "At least one passenger"),
  contactName: nameSchema,
  contactPhone: phoneSchema,
  contactEmail: emailSchema,
});
export type CharterInput = z.infer<typeof charterSchema>;

// ---------------------------------------------------------------------------
// Operator registration
// ---------------------------------------------------------------------------

export const operatorRegistrationSchema = z.object({
  companyName: z.string().trim().min(2, "Enter the company name"),
  contactName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  city: z.string().min(1, "Select a city"),
  fleetSize: z.string().min(1, "Enter your fleet size"),
  vehicleTypes: z.array(z.string()).min(1, "Select at least one vehicle type"),
  routes: z.string().min(1, "Enter the routes you operate"),
  yearsInOperation: z.string().min(1, "Enter years in operation"),
  cacNumber: z.string().optional().default(""),
  additionalInfo: z.string().optional().default(""),
});
export type OperatorRegistrationInput = z.infer<typeof operatorRegistrationSchema>;

// ---------------------------------------------------------------------------
// Waybill
// ---------------------------------------------------------------------------

// Field names mirror the API contract (WaybillPayload / Prisma Waybill) so this
// schema can validate the WaybillForm payload directly without a rename layer.
export const waybillSchema = z.object({
  fromLocation: z.string().min(1, "Select an origin"),
  toLocation: z.string().min(1, "Select a destination"),
  senderName: nameSchema,
  senderPhone: phoneSchema,
  recipientName: nameSchema,
  recipientPhone: phoneSchema,
  description: z.string().min(1, "Describe the item"),
  weightKg: z.string().min(1, "Enter the weight"),
  declaredValue: z.string().min(1, "Enter the declared value"),
});
export type WaybillInput = z.infer<typeof waybillSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Validate `data` against `schema`. On success returns the parsed data;
 * on failure returns a flat `{ field: firstMessage }` map for form display.
 */
export function validate<S extends z.ZodType>(
  schema: S,
  data: unknown
):
  | { success: true; data: z.infer<S> }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

/** First top-level error message, handy for single-line form banners. */
export function firstError(errors: Record<string, string>): string {
  for (const key of Object.keys(errors)) {
    const msg = errors[key];
    if (msg) return msg;
  }
  return "";
}
