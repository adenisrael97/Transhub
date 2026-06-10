import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";
import { searchSchema, dateRangeSchema } from "../../shared/list-query";

/**
 * Transactions/payments list query. The transactions feed is a read-only UNION
 * over every payment-bearing record (bookings, charters, waybills), so filters
 * apply to the unified row, not to one table.
 *  - type:    restrict to one product (booking | charter | waybill)
 *  - status:  payment/lifecycle state (values differ per type, so free string)
 *  - operatorId: admin-only — restrict to one operator's transactions
 *  - min/maxAmount: amount band (naira)
 *  - dateFrom/dateTo: transaction date range
 *  - search:  reference / customer name / customer email / route description
 */
export const listTransactionsQuerySchema = z.object({
  type:       z.enum(["booking", "charter", "waybill"]).optional(),
  status:     z.string().trim().max(40).optional(),
  operatorId: z.string().uuid().optional(),
  minAmount:  z.coerce.number().min(0).optional(),
  maxAmount:  z.coerce.number().min(0).optional(),
  ...dateRangeSchema.shape,
  ...searchSchema.shape,
  ...paginationQuerySchema.shape,
});

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
