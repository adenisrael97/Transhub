import api from "@/lib/api";
import type { PageMeta, ListParams } from "@/types";

export interface TicketDTO {
  bookingId:      string;
  paymentRef:     string;
  status:         string;
  passengerName:  string;
  passengerPhone: string;
  from:           string;
  to:             string;
  departureTime:  string;
  arrivalTime:    string | null;
  operator:       string;
  vehicleType:    string;
  seatCount:      number;
  totalAmount:    number;
  bookedAt:       string;
}

export interface TicketSummaryDTO {
  bookingId:     string;
  paymentRef:    string;
  status:        string;
  from:          string;
  to:            string;
  departureTime: string;
  seatCount:     number;
  totalAmount:   number;
  bookedAt:      string;
}

export interface TicketsEnvelope { tickets: TicketSummaryDTO[]; pagination?: PageMeta }

/** Passenger's confirmed tickets — paginated + searchable (route / payment ref). */
export function fetchTickets(params?: ListParams): Promise<TicketsEnvelope> {
  return api.get<TicketsEnvelope, TicketsEnvelope>("/tickets", { params });
}

/** Single ticket detail — the cacheable boarding pass. */
export function fetchTicket(bookingId: string): Promise<{ ticket: TicketDTO }> {
  return api.get<{ ticket: TicketDTO }, { ticket: TicketDTO }>(
    `/tickets/${bookingId}`
  );
}
