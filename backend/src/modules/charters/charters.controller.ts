import type { Request, Response } from "express";
import { chartersService } from "./charters.service";
import { paymentsService } from "../payments";
import { listChartersQuerySchema, type CreateCharterInput, type SendQuoteInput, type ConfirmBookingInput } from "./charters.schema";
import type { CharterDTO } from "./charters.repository";

// Strip internal financial fields that passengers must never see.
// operatorCost and serviceFee are the internal cost breakdown; passengers only
// see quotedPrice (their total). operatorName is admin-internal sourcing info;
// passengers see assignedOperator (post-confirmation) instead.
function forPassenger(c: CharterDTO): Omit<CharterDTO, "operatorName" | "operatorCost" | "serviceFee"> {
  const { operatorName: _n, operatorCost: _c, serviceFee: _f, ...rest } = c;
  return rest;
}

export const chartersController = {
  async createCharter(req: Request, res: Response): Promise<void> {
    const charter = await chartersService.requestCharter(
      req.user!.id,
      req.body as CreateCharterInput
    );
    res.status(201).json({ charter: forPassenger(charter) });
  },

  async listMyCharters(req: Request, res: Response): Promise<void> {
    const { page, limit, ...filter } = listChartersQuerySchema.parse(req.query);
    const { charters, pagination } = await chartersService.getMyCharters(req.user!.id, filter, { page, limit });
    res.json({ charters: charters.map(forPassenger), pagination });
  },

  async listAllCharters(req: Request, res: Response): Promise<void> {
    const { page, limit, ...filter } = listChartersQuerySchema.parse(req.query);
    const { charters, pagination } = await chartersService.getAllCharters(filter, { page, limit });
    res.json({ charters, pagination });
  },

  async getCharter(req: Request, res: Response): Promise<void> {
    const charter = await chartersService.getCharterById(
      req.params.id as string,
      req.user!.id,
      req.user!.role
    );
    const body = req.user!.role === "passenger" ? forPassenger(charter) : charter;
    res.json({ charter: body });
  },

  async sendQuote(req: Request, res: Response): Promise<void> {
    const charter = await chartersService.sendQuote(
      req.params.id as string,
      req.body as SendQuoteInput
    );
    res.json({ charter });
  },

  async acceptQuote(req: Request, res: Response): Promise<void> {
    const charter = await chartersService.acceptQuote(
      req.params.id as string,
      req.user!.id
    );
    res.json({ charter: forPassenger(charter) });
  },

  async rejectQuote(req: Request, res: Response): Promise<void> {
    const charter = await chartersService.rejectQuote(
      req.params.id as string,
      req.user!.id
    );
    res.json({ charter: forPassenger(charter) });
  },

  async initiatePayment(req: Request, res: Response): Promise<void> {
    const result = await chartersService.initiatePayment(
      req.params.id as string,
      req.user!.id,
      (charter, userEmail) =>
        paymentsService.initializeCharterPayment(charter, userEmail)
    );
    res.json(result);
  },

  async verifyPayment(req: Request, res: Response): Promise<void> {
    const { state, charter } = await chartersService.verifyPayment(
      req.params.id as string,
      req.user!.id,
      (reference) => paymentsService.lookupTransaction(reference)
    );
    res.json({ state, charter: forPassenger(charter) });
  },

  async adminConfirmBooking(req: Request, res: Response): Promise<void> {
    const charter = await chartersService.adminConfirmBooking(
      req.params.id as string,
      req.body as ConfirmBookingInput
    );
    res.json({ charter });
  },

  async completeCharter(req: Request, res: Response): Promise<void> {
    const charter = await chartersService.completeCharter(req.params.id as string);
    res.json({ charter });
  },

  async cancelCharter(req: Request, res: Response): Promise<void> {
    const charter = await chartersService.cancelCharter(
      req.params.id as string,
      req.user!.id,
      req.user!.role
    );
    const body = req.user!.role === "passenger" ? forPassenger(charter) : charter;
    res.json({ charter: body });
  },
};
