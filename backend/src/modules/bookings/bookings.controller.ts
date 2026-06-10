/**
 * HTTP layer for bookings — reads req, sends res, zero business logic.
 */
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors";
import { bookingsService } from "./bookings.service";
import { listBookingsQuerySchema, type HoldInput } from "./bookings.schema";

export const bookingsController = {
  async hold(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const result = await bookingsService.hold(req.body as HoldInput, req.user.id);
    res.status(201).json(result);
  },

  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    // Re-parse: validateQuery guards but can't write back to Express 5's
    // getter-only req.query, so coercion/defaults aren't applied there.
    const { page, limit, ...filter } = listBookingsQuerySchema.parse(req.query);
    const result = await bookingsService.list(
      req.user.id,
      req.user.role,
      filter,
      { page, limit },
      req.user.operatorId ?? null
    );
    res.json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const id = req.params.id as string;
    const booking = await bookingsService.getById(id, req.user.id, req.user.role);
    res.json({ booking });
  },
};
