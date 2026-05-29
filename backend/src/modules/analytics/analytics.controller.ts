/** HTTP layer for analytics — reads req, calls repository, sends res. */
import type { Request, Response } from "express";
import { analyticsRepository } from "./analytics.repository";
import { revenueQuerySchema } from "./analytics.schema";

export const analyticsController = {
  async summary(_req: Request, res: Response): Promise<void> {
    const data = await analyticsRepository.getSummary();
    res.json(data);
  },

  async revenue(req: Request, res: Response): Promise<void> {
    // Re-parse here: validateQuery guards but can't write back to the
    // getter-only Express 5 req.query, so coercion/defaults aren't applied yet.
    const { days } = revenueQuerySchema.parse(req.query);
    const data = await analyticsRepository.getRevenueByDay(days);
    res.json(data);
  },

  async routes(_req: Request, res: Response): Promise<void> {
    const data = await analyticsRepository.getTopRoutes();
    res.json(data);
  },

  async operators(_req: Request, res: Response): Promise<void> {
    const data = await analyticsRepository.getBookingsByOperator();
    res.json(data);
  },
};
