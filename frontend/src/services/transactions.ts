import api from "@/lib/api";
import type { Transaction, PageMeta, ListParams } from "@/types";

export interface TransactionsEnvelope {
  transactions: Transaction[];
  pagination?: PageMeta;
}

/**
 * Unified payments/transactions feed — server-side paginated/filtered/searchable.
 * Admin sees all; operators are scoped to their own (their trips' bookings +
 * waybills assigned to them) on the backend.
 * Params: page, limit, type (booking|charter|waybill), status, operatorId,
 * minAmount, maxAmount, dateFrom, dateTo, search.
 */
export function fetchTransactions(params?: ListParams): Promise<TransactionsEnvelope> {
  return api.get<TransactionsEnvelope, TransactionsEnvelope>("/transactions", { params });
}
