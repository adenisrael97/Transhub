/** Zod schemas for operator inputs. Mirror the frontend's registration form. */
import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";

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
  ...paginationQuerySchema.shape,
});

export type RegisterOperatorInput = z.infer<typeof registerOperatorSchema>;
export type ListOperatorsQuery    = z.infer<typeof listOperatorsQuerySchema>;
