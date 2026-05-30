import { z } from "zod";

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
