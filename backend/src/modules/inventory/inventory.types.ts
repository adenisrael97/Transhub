import type { Prisma } from "@prisma/client";

export type Tx = Prisma.TransactionClient;

export interface HoldResult {
  holdId:     string;
  expiresAt:  string; // ISO-8601
  ttlSeconds: number;
  tripId:     string;
  quantity:   number;
}
