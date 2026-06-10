import api from "@/lib/api";
import type { Waybill, ApprovedOperator, PageMeta, ListParams } from "@/types";

export interface WaybillsEnvelope { waybills: Waybill[]; pagination?: PageMeta }

export interface CreateWaybillResponse {
  id:        string;
  waybillNo: string;
  status:    string;
}

export interface InitiatePayResponse {
  paymentUrl: string;
}

export interface SendQuotePayload {
  assignedOperatorId: string;
  quoteAmount:        number;
  quoteNote?:         string;
}

export interface UpdateStatusPayload {
  status:    string;
  location?: string;
  note?:     string;
}

/** Customer: submit a new waybill request (no payment — admin quotes later). */
export function createWaybill(
  payload: Omit<Waybill, "id" | "waybillNo" | "userId" | "status" | "fee" | "events" | "createdAt" | "updatedAt">
): Promise<Waybill> {
  return api.post<Waybill, Waybill>("/waybills", payload);
}

/** Customer: own waybills (paginated/filtered). Params: page, limit, status, search, dateFrom/dateTo. */
export function listMyWaybills(params?: ListParams): Promise<WaybillsEnvelope> {
  return api.get<WaybillsEnvelope, WaybillsEnvelope>("/waybills/mine", { params });
}

/** Public unauthenticated tracking by waybill number. */
export function fetchWaybill(waybillNo: string): Promise<Waybill> {
  return api.get<Waybill, Waybill>(`/waybills/${waybillNo}`);
}

/**
 * Admin/operator: waybills list — server-side paginated/filtered/searchable.
 * Params: page, limit, status, assignedOperatorId, tripId, search, dateFrom/dateTo.
 * Operators are scoped to their own assigned waybills on the backend.
 */
export function listWaybills(params?: ListParams): Promise<WaybillsEnvelope> {
  return api.get<WaybillsEnvelope, WaybillsEnvelope>("/waybills", { params });
}

/** Admin: send quote + assign transport company. */
export function sendQuote(id: string, payload: SendQuotePayload): Promise<Waybill> {
  return api.patch<Waybill, Waybill>(`/waybills/${id}/quote`, payload);
}

/** Customer: initiate Paystack payment for a quoted waybill. */
export function initiatePay(id: string): Promise<InitiatePayResponse> {
  return api.post<InitiatePayResponse, InitiatePayResponse>(`/waybills/${id}/pay`, {});
}

export interface VerifyWaybillResult {
  state:   "success" | "pending" | "failed";
  waybill: Waybill;
}

/**
 * Customer: verify a waybill payment after returning from Paystack.
 * Webhook-independent — the success page calls this so it reflects the REAL
 * outcome instead of trusting the redirect (a cancelled payment is NOT a success).
 */
export function verifyWaybillPayment(reference: string): Promise<VerifyWaybillResult> {
  return api.post<VerifyWaybillResult, VerifyWaybillResult>(`/waybills/verify/${encodeURIComponent(reference)}`, {});
}

/** Admin/operator: update waybill lifecycle status. */
export function updateWaybillStatus(id: string, payload: UpdateStatusPayload): Promise<Waybill> {
  return api.patch<Waybill, Waybill>(`/waybills/${id}/status`, payload);
}

/** Admin: fetch approved transport companies for assignment dropdown. */
export function listApprovedOperators(): Promise<ApprovedOperator[]> {
  return api.get<ApprovedOperator[], ApprovedOperator[]>("/operators/approved");
}
