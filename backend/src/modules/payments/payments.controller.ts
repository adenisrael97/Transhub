/**
 * HTTP layer for payments — reads req, sends res, zero business logic.
 *
 * webhook: must always respond 200 so Paystack does not retry.  A tampered
 *          webhook (bad signature) is the one intended exception — the service
 *          throws UnauthorizedError, and the error handler returns 401.
 */
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors";
import { paymentsService } from "./payments.service";
import type { InitializeInput } from "./payments.schema";

export const paymentsController = {
  async initialize(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const result = await paymentsService.initialize(req.user.id, req.body as InitializeInput);
    res.status(201).json(result);
  },

  async webhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers["x-paystack-signature"];
    if (typeof sig !== "string") throw new UnauthorizedError("Missing Paystack signature header");
    // express.raw() (mounted upstream in app.ts) leaves req.body as a Buffer when
    // Content-Type is application/json. A non-Buffer means the request didn't come
    // through that path / wrong content-type — it can't be signature-verified, reject it.
    if (!Buffer.isBuffer(req.body)) throw new UnauthorizedError("Invalid webhook payload");
    await paymentsService.handleWebhook(req.body, sig);
    res.sendStatus(200);
  },

  async verify(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const booking = await paymentsService.verifyPayment(req.params.reference as string, req.user.id);
    if (!booking) {
      res.status(202).json({ status: "pending" });
      return;
    }
    res.json({ booking });
  },
};
