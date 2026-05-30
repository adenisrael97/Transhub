import { z } from "zod";

export const passengerInfoSchema = z.object({
  fullName:      z.string().trim().min(2),
  phone:         z.string().trim().min(7),
  email:         z.string().email().optional().or(z.literal("")).transform(v => v || undefined),
  nextOfKinName: z.string().trim().min(2),
  nextOfKinPhone: z.string().trim().min(7),
  specialNeeds:  z.string().trim().max(200).optional(),
});

// The client sends the trip + one passenger entry per held seat.
// The server resolves which seats this user holds (durable heldBy column) to
// compute the amount — seat IDs are never trusted from the client.
export const initializeSchema = z.object({
  tripId:     z.uuid(),
  passengers: z.array(passengerInfoSchema).min(1),
});

// Minimal webhook body shape — extra Paystack fields silently ignored by Zod.
export const webhookBodySchema = z.object({
  event: z.string(),
  data:  z.object({
    reference: z.string(),
    status:    z.string(),
    amount:    z.number(),
    metadata:  z
      .object({
        tripId:  z.uuid(),
        seatIds: z.array(z.uuid()).min(1),
        userId:  z.uuid(),
      })
      .optional(),
  }),
});

export type PassengerInfoInput = z.infer<typeof passengerInfoSchema>;
export type InitializeInput    = z.infer<typeof initializeSchema>;
export type WebhookBody        = z.infer<typeof webhookBodySchema>;
