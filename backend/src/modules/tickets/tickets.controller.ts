/**
 * HTTP layer for tickets — reads req, sends res, zero business logic.
 */
import { z } from "zod";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors";
import { paginationQuerySchema } from "../../shared/pagination";
import { searchSchema } from "../../shared/list-query";
import { ticketsService } from "./tickets.service";

/** Ticket history query: pagination + optional search (route / payment ref). */
export const listTicketsQuerySchema = z.object({
  ...searchSchema.shape,
  ...paginationQuerySchema.shape,
});

export const ticketsController = {
  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    // Re-parse: validateQuery guards but can't write back to the getter-only
    // Express 5 req.query, so coercion/defaults aren't applied there.
    const { page, limit, search } = listTicketsQuerySchema.parse(req.query);
    const result = await ticketsService.listTickets(req.user.id, search, { page, limit });
    res.json(result);
  },

  async get(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const bookingId = req.params.bookingId as string;
    const ticket = await ticketsService.getTicket(bookingId, req.user.id);
    res.json({ ticket });
  },
};
