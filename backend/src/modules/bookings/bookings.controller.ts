/**
 * HTTP layer for bookings — reads req, sends res, zero business logic.
 */
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors";
import { paginationQuerySchema } from "../../shared/pagination";
import { bookingsService } from "./bookings.service";
import type { HoldInput } from "./bookings.schema";

export const bookingsController = {
  async hold(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const result = await bookingsService.hold(req.body as HoldInput, req.user.id);
    res.status(201).json(result);
  },

  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const pagination = paginationQuerySchema.parse(req.query);
    const result = await bookingsService.list(
      req.user.id,
      req.user.role,
      pagination,
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
