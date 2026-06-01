import type { Request, Response } from "express";
import { ForbiddenError } from "../../shared/errors";
import { waybillsService } from "./waybills.service";

export const waybillsController = {
  async createWaybill(req: Request, res: Response): Promise<void> {
    const { id: userId, email: userEmail } = req.user!;
    // Drivers have no email and cannot create waybills (payment requires an email).
    if (!userEmail) throw new ForbiddenError("Drivers cannot create waybills");
    const result = await waybillsService.createWaybill(req.body, userId, userEmail);
    res.status(201).json(result);
  },

  async trackWaybill(req: Request, res: Response): Promise<void> {
    const waybill = await waybillsService.trackWaybill(String(req.params.no));
    res.json(waybill);
  },

  async listWaybills(req: Request, res: Response): Promise<void> {
    const { status, tripId } = req.query as { status?: string; tripId?: string };
    const waybills = await waybillsService.listWaybills({ status, tripId });
    res.json(waybills);
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const waybill = await waybillsService.updateWaybillStatus(
      String(req.params.id),
      req.user!.role,
      req.body
    );
    res.json(waybill);
  },
};
