/** Zod schemas for analytics query params. */
import { z } from "zod";

export const revenueQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
});

export type RevenueQuery = z.infer<typeof revenueQuerySchema>;
