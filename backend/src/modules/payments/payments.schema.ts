import { z } from "zod";

export const initializeSchema = z.object({
  tripId:  z.uuid(),
  seatIds: z.array(z.uuid()).min(1),
});

// The full webhook body from Paystack.  We only assert the minimum shape we
// need; extra fields (channel, currency, etc.) are silently ignored by Zod.
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

export type InitializeInput = z.infer<typeof initializeSchema>;
export type WebhookBody     = z.infer<typeof webhookBodySchema>;
