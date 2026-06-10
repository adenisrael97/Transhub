/**
 * Tickets business logic. Read-only — turns a missing/foreign booking into a
 * 404 so ownership never leaks as a 403.
 */
import { NotFoundError } from "../../shared/errors";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import {
  ticketsRepository,
  type TicketDTO,
  type TicketSummaryDTO,
} from "./tickets.repository";

export const ticketsService = {
  async getTicket(bookingId: string, userId: string): Promise<TicketDTO> {
    const ticket = await ticketsRepository.findById(bookingId, userId);
    if (!ticket) throw new NotFoundError("Ticket not found");
    return ticket;
  },

  async listTickets(
    userId: string,
    search: string | undefined,
    pagination: PaginationQuery
  ): Promise<{ tickets: TicketSummaryDTO[]; pagination: PageMeta }> {
    const { items, total } = await ticketsRepository.findByUser(userId, search, pagination);
    return { tickets: items, pagination: pageMeta(total, pagination) };
  },
};
