import type { Request, Response } from "express";
import { ForbiddenError } from "../../shared/errors";
import { waybillsService } from "./waybills.service";
import { listWaybillsQuerySchema } from "./waybills.schema";

export const waybillsController = {
  /** Customer: create waybill request. No payment — admin quotes later. */
  async createWaybill(req: Request, res: Response): Promise<void> {
    const { id: userId } = req.user!;
    const waybill = await waybillsService.createWaybill(req.body, userId);
    res.status(201).json(waybill);
  },

  /** Customer: list their own waybills (paginated + filtered). */
  async listMyWaybills(req: Request, res: Response): Promise<void> {
    const { id: userId } = req.user!;
    const { page, limit, ...filter } = listWaybillsQuerySchema.parse(req.query);
    const result = await waybillsService.listMyWaybills(userId, filter, { page, limit });
    res.json(result);
  },

  /** Public unauthenticated tracking by waybill number. */
  async trackWaybill(req: Request, res: Response): Promise<void> {
    const waybill = await waybillsService.trackWaybill(String(req.params.no));
    res.json(waybill);
  },

  /** Admin/operator: list waybills. Operators are scoped to their own (service-enforced). */
  async listWaybills(req: Request, res: Response): Promise<void> {
    const { page, limit, ...filter } = listWaybillsQuerySchema.parse(req.query);
    const { role, operatorId } = req.user!;
    const result = await waybillsService.listWaybills(filter, { role, operatorId }, { page, limit });
    res.json(result);
  },

  /** Admin: assign transport company and send a quote → quote_sent. */
  async sendQuote(req: Request, res: Response): Promise<void> {
    if (req.user!.role !== "admin") throw new ForbiddenError("Admin only");
    const waybill = await waybillsService.sendQuote(String(req.params.id), req.body);
    res.json(waybill);
  },

  /** Customer: initiate Paystack payment for a quoted waybill. */
  async initiatePay(req: Request, res: Response): Promise<void> {
    const { id: userId, email: userEmail } = req.user!;
    if (!userEmail) throw new ForbiddenError("Account has no email — cannot process payment");
    const result = await waybillsService.initiatePay(
      String(req.params.id),
      userId,
      userEmail
    );
    res.json(result);
  },

  /** Customer: verify payment after returning from Paystack (webhook-independent). */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    const { id: userId } = req.user!;
    const { state, waybill } = await waybillsService.verifyPayment(String(req.params.reference), userId);
    res.json({ state, waybill });
  },

  /** Admin/operator: update status (post-payment lifecycle). */
  async updateStatus(req: Request, res: Response): Promise<void> {
    const { role, operatorId } = req.user!;
    const waybill = await waybillsService.updateWaybillStatus(
      String(req.params.id),
      { role, operatorId },
      req.body
    );
    res.json(waybill);
  },
};
