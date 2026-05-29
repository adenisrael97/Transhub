/**
 * Payments data access. The payments module owns no tables of its own; it only
 * needs to read a trip's price to recompute the expected charge (never trusting
 * the client or the webhook for the amount). Cross-table reads are allowed; the
 * trips module remains the sole writer of the `trips` table.
 */
import { prisma } from "../../infra/db/client";

export const paymentsRepository = {
  /** Trip price in naira, or null if the trip doesn't exist. */
  async findTripPrice(tripId: string): Promise<number | null> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { price: true } });
    return trip?.price ?? null;
  },
};
