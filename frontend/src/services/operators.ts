import api from "@/lib/api";
import type { Operator, PageMeta, ListParams } from "@/types";

export interface UpdateOperatorProfilePayload {
  companyName?: string;
  contactName?: string;
  phone?: string;
  city?: string;
  routes?: string;
  fleetSize?: string;
}

export type OperatorRegistrationPayload = Omit<
  Operator,
  "id" | "status" | "appliedAt" | "reviewedAt"
>;

/** Backend envelopes */
interface OperatorResponse       { operator: Operator }
interface OperatorsListResponse  { operators: Operator[]; pagination?: PageMeta }
interface ApproveResponse        { operator: Operator; tempPassword: string }

/** Submit operator registration application. */
export function registerOperator(
  payload: OperatorRegistrationPayload
): Promise<OperatorResponse> {
  return api.post<OperatorResponse, OperatorResponse>("/operators/register", payload);
}

/**
 * Admin operators list — server-side paginated/filtered/searchable.
 * Params: page, limit, status, search (company/contact/email/city).
 */
export function fetchOperators(params?: ListParams): Promise<OperatorsListResponse> {
  return api.get<OperatorsListResponse, OperatorsListResponse>("/operators", { params });
}

/** Compact list of approved operators (id + companyName) for the public search filter. */
export interface PublicOperator { id: string; companyName: string }
export function fetchPublicOperators(): Promise<{ operators: PublicOperator[] }> {
  return api.get<{ operators: PublicOperator[] }, { operators: PublicOperator[] }>(
    "/operators/public"
  );
}

/** Approve an operator application (admin). Returns operator + one-time temp password. */
export function approveOperator(id: string): Promise<ApproveResponse> {
  return api.patch<ApproveResponse, ApproveResponse>(`/operators/${id}/approve`);
}

/** Decline an operator application (admin). */
export function declineOperator(id: string): Promise<OperatorResponse> {
  return api.patch<OperatorResponse, OperatorResponse>(`/operators/${id}/decline`);
}

/** Fetch the calling operator's own profile. */
export function getMyOperatorProfile(): Promise<OperatorResponse> {
  return api.get<OperatorResponse, OperatorResponse>("/operators/me");
}

/** Update the calling operator's own profile. */
export function updateMyOperatorProfile(
  payload: UpdateOperatorProfilePayload
): Promise<OperatorResponse> {
  return api.patch<OperatorResponse, OperatorResponse>("/operators/me", payload);
}
