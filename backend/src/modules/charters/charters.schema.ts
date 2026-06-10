import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";
import { searchSchema, dateRangeSchema } from "../../shared/list-query";

/** The full charter lifecycle states (charters.status is a free String column). */
export const CHARTER_STATUSES = [
  "pending", "quote_sent", "awaiting_payment", "confirmed", "completed", "cancelled",
] as const;

/**
 * Charter list query (admin "all" + passenger "mine").
 *  - status:  charter lifecycle state
 *  - dateFrom/dateTo: createdAt (request date) range
 *  - search:  reference no / route / contact / passenger name·email·phone
 */
export const listChartersQuerySchema = z.object({
  status: z.enum(CHARTER_STATUSES).optional(),
  ...dateRangeSchema.shape,
  ...searchSchema.shape,
  ...paginationQuerySchema.shape,
});

export type ListChartersQuery = z.infer<typeof listChartersQuerySchema>;

export const createCharterSchema = z.object({
  vehicleType:    z.string().min(1).max(50),
  fromLocation:   z.string().trim().min(2).max(200),
  toLocation:     z.string().trim().min(2).max(200),
  departureAt:    z.string().datetime({ message: "departureAt must be an ISO 8601 datetime" }),
  returnAt:       z.string().datetime({ message: "returnAt must be an ISO 8601 datetime" }).optional(),
  passengerCount: z.number().int().min(1).max(200),
  notes:          z.string().trim().max(500).optional(),
  contactName:    z.string().trim().max(200).optional(),
  contactPhone:   z.string().trim().max(30).optional(),
  contactEmail:   z.string().email().optional().or(z.literal("")).transform(v => v || undefined),
});

export const sendQuoteSchema = z.object({
  operatorName: z.string().trim().min(1, "Operator name is required").max(200),
  operatorCost: z.number().positive("Operator cost must be positive"),
  serviceFee:   z.number().nonnegative("Service fee must be non-negative"),
  quotedPrice:  z.number().positive("Final customer price must be positive"),
  adminNotes:   z.string().trim().max(1000).optional(),
});

export const confirmBookingSchema = z.object({
  assignedOperator: z.string().trim().min(1, "Assigned operator is required").max(200),
  pickupInfo:       z.string().trim().min(1, "Pickup information is required").max(1000),
  travelInfo:       z.string().trim().min(1, "Travel information is required").max(1000),
});

export type CreateCharterInput   = z.infer<typeof createCharterSchema>;
export type SendQuoteInput       = z.infer<typeof sendQuoteSchema>;
export type ConfirmBookingInput  = z.infer<typeof confirmBookingSchema>;
