import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";
import { searchSchema, dateRangeSchema } from "../../shared/list-query";

const phoneRegex = /^\+?[0-9]{10,15}$/;

// ---------------------------------------------------------------------------
// Status definitions
// ---------------------------------------------------------------------------

export const WAYBILL_STATUSES = [
  "pending",          // customer submitted request
  "quote_sent",       // admin assigned operator + quoted price
  "paid",             // customer paid
  "dropped_off",      // customer dropped parcel at origin hub
  "picked_up",        // carrier collected parcel from origin hub
  "in_transit",       // en-route to destination hub
  "arrived_at_hub",   // reached destination hub
  "completed",        // receiver collected; admin closed
  "cancelled",        // cancelled at any pre-transit stage
] as const;

export type WaybillStatus = (typeof WAYBILL_STATUSES)[number];

/**
 * Waybill list query (admin all / operator scoped / customer own).
 *  - status:             lifecycle state
 *  - assignedOperatorId: admin filter by company (forced to self for operators)
 *  - tripId:             attach-to-trip filter
 *  - dateFrom/dateTo:    createdAt range
 *  - search:             waybill no / sender·recipient name·phone / route / description
 */
export const listWaybillsQuerySchema = z.object({
  status:             z.enum(WAYBILL_STATUSES).optional(),
  assignedOperatorId: z.string().uuid().optional(),
  tripId:             z.string().uuid().optional(),
  ...dateRangeSchema.shape,
  ...searchSchema.shape,
  ...paginationQuerySchema.shape,
});

export type ListWaybillsQuery = z.infer<typeof listWaybillsQuerySchema>;

/**
 * Valid forward transitions per status.
 * Only moves listed here are accepted; all others return 409.
 */
export const VALID_TRANSITIONS: Record<WaybillStatus, WaybillStatus[]> = {
  pending:        ["quote_sent", "cancelled"],
  quote_sent:     ["paid", "cancelled"],
  paid:           ["dropped_off", "cancelled"],
  dropped_off:    ["picked_up"],
  picked_up:      ["in_transit"],
  in_transit:     ["arrived_at_hub"],
  arrived_at_hub: ["completed"],
  completed:      [],
  cancelled:      [],
};

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

/** Customer: create waybill request (no payment — admin quotes later). */
export const createWaybillSchema = z.object({
  tripId:         z.string().uuid().optional(),
  senderName:     z.string().min(2).max(100),
  senderPhone:    z.string().regex(phoneRegex, "Invalid phone number"),
  recipientName:  z.string().min(2).max(100),
  recipientPhone: z.string().regex(phoneRegex, "Invalid phone number"),
  fromLocation:   z.string().min(2).max(200),
  toLocation:     z.string().min(2).max(200),
  description:    z.string().min(2).max(500),
  weightKg:       z.number().positive().max(1000).optional(),
  declaredValue:  z.number().positive().optional(),
});

/** Admin: assign transport company and send a quote. Transitions pending → quote_sent. */
export const sendQuoteSchema = z.object({
  assignedOperatorId: z.string().uuid(),
  quoteAmount:        z.number().positive({ message: "Quote amount must be positive" }),
  quoteNote:          z.string().max(500).optional(),
});

/**
 * Admin / operator: generic status update for post-payment stages.
 * Covers: dropped_off, picked_up, in_transit, arrived_at_hub, completed, cancelled.
 */
export const updateStatusSchema = z.object({
  status:   z.enum(["dropped_off", "picked_up", "in_transit", "arrived_at_hub", "completed", "cancelled"]),
  location: z.string().max(200).optional(),
  note:     z.string().max(500).optional(),
});

export type CreateWaybillInput = z.infer<typeof createWaybillSchema>;
export type SendQuoteInput     = z.infer<typeof sendQuoteSchema>;
export type UpdateStatusInput  = z.infer<typeof updateStatusSchema>;
