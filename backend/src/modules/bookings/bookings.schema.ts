import { z } from "zod";

export const holdSchema = z.object({
  tripId:  z.uuid(),
  seatIds: z.array(z.uuid()).min(1, "Select at least one seat").max(6, "Maximum 6 seats per booking"),
});

// Internal shape for the confirm flow. confirm is NOT a public endpoint — it is
// driven only by the verified Paystack webhook — so this is the type contract
// between payments and bookings, not request-body validation.
export const confirmSchema = z.object({
  paymentRef: z.string().min(1, "Payment reference is required"),
  tripId:     z.uuid(),
  seatIds:    z.array(z.uuid()).min(1),
});

export type HoldInput    = z.infer<typeof holdSchema>;
export type ConfirmInput = z.infer<typeof confirmSchema>;
