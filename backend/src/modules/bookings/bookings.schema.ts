import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";
import { searchSchema, dateRangeSchema } from "../../shared/list-query";

/**
 * Admin/operator booking list query. All filters optional and AND-combined.
 *  - status:    BookingStatus equality
 *  - operatorId: admin-only — restrict to one operator's trips (ignored for operators,
 *                who are already scoped to their own operatorId from the JWT)
 *  - min/maxAmount: revenue band on totalAmount (naira)
 *  - dateFrom/dateTo: createdAt range (WAT day bounds)
 *  - search:    matches booking id, paymentRef, or the booking's user
 *               (full name / email / phone)
 */
export const listBookingsQuerySchema = z.object({
  status:     z.enum(["pending", "confirmed", "cancelled", "refunded"]).optional(),
  operatorId: z.uuid().optional(),
  minAmount:  z.coerce.number().int().min(0).optional(),
  maxAmount:  z.coerce.number().int().min(0).optional(),
  ...dateRangeSchema.shape,
  ...searchSchema.shape,
  ...paginationQuerySchema.shape,
});

export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;

export const holdSchema = z.object({
  tripId:   z.uuid(),
  // Seatless model: the passenger books a QUANTITY of seats, not specific labels.
  // The server auto-claims that many free slots — operators run mixed vehicles with
  // unknown/unenforced seat arrangements, so a seat map would be meaningless.
  quantity: z.coerce.number().int().min(1, "Select at least 1 seat").max(6, "Maximum 6 seats per booking"),
});

export const passengerInfoInputSchema = z.object({
  fullName:       z.string().trim().min(2),
  phone:          z.string().trim().min(7),
  email:          z.string().email().optional().or(z.literal("")).transform(v => v || undefined),
  nextOfKinName:  z.string().trim().min(2),
  nextOfKinPhone: z.string().trim().min(7),
  specialNeeds:   z.string().trim().max(200).optional(),
});

// Internal only — not a public endpoint. No OpenAPI annotation needed.
// seatIds are resolved server-side from the user's hold (never sent by the client);
// confirm still consumes concrete IDs so the SELECT FOR UPDATE locking is unchanged.
// passengers is optional — graceful degradation when Redis lost the cached PII.
export const confirmSchema = z.object({
  paymentRef: z.string().min(1, "Payment reference is required"),
  tripId:     z.uuid(),
  seatIds:    z.array(z.uuid()).min(1),
  passengers: z.array(passengerInfoInputSchema).optional(),
});

export type HoldInput           = z.infer<typeof holdSchema>;
export type ConfirmInput        = z.infer<typeof confirmSchema>;
export type PassengerInfoInput  = z.infer<typeof passengerInfoInputSchema>;
