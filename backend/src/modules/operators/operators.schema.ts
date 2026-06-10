/** Zod schemas for operator inputs. Mirror the frontend's registration form. */
import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";
import { searchSchema } from "../../shared/list-query";

export const registerOperatorSchema = z.object({
  companyName:      z.string().min(2,  "Company name is required"),
  contactName:      z.string().min(2,  "Contact person name is required"),
  email:            z.email("A valid email is required")
                              .transform((s) => s.toLowerCase().trim()),
  phone:            z.string().min(7,  "A valid phone number is required"),
  city:             z.string().min(2,  "City is required"),
  fleetSize:        z.string().min(1,  "Fleet size is required"),
  vehicleTypes:     z.array(z.string().min(1)).min(1, "Select at least one vehicle type"),
  routes:           z.string().min(5,  "Please describe your routes"),
  yearsInOperation: z.string().min(1,  "Years in operation is required"),
  cacNumber:        z.string().min(2,  "CAC registration number is required"),
  additionalInfo:   z.string().optional(),
});

export const listOperatorsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "declined"]).optional(),
  // Search across company name, contact person, email, and city.
  ...searchSchema.shape,
  ...paginationQuerySchema.shape,
});

/** Fields an operator can self-edit after approval. */
export const updateOperatorProfileSchema = z.object({
  companyName: z.string().min(2).max(200).optional(),
  contactName: z.string().min(2).max(200).optional(),
  phone:       z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number").optional(),
  city:        z.string().min(2).max(200).optional(),
  routes:      z.string().min(5).max(1000).optional(),
  fleetSize:   z.string().min(1).max(100).optional(),
});

export type RegisterOperatorInput        = z.infer<typeof registerOperatorSchema>;
export type ListOperatorsQuery           = z.infer<typeof listOperatorsQuerySchema>;
export type UpdateOperatorProfileInput   = z.infer<typeof updateOperatorProfileSchema>;
