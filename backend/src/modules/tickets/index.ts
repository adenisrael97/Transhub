// Public interface — other modules import only from here, never from internals.
export { ticketsRouter }  from "./tickets.routes";
export { ticketsService } from "./tickets.service";
export type { TicketDTO, TicketSummaryDTO } from "./tickets.repository";
