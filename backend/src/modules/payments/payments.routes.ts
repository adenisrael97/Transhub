/**
 * Payments routes — initialize only.
 *
 * The webhook route is NOT here; it needs express.raw() applied before the
 * global express.json() middleware, so it is mounted directly in app.ts.
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole }  from "../../middleware/rbac";
import { rateLimit }    from "../../middleware/rate-limit";
import { validateBody } from "../../middleware/validate";
import { initializeSchema } from "./payments.schema";
import { paymentsController } from "./payments.controller";

export const paymentsRouter = Router();

// Passenger initiates a Paystack transaction for their held seats.
// Throttled per user (authenticate runs first) to cap provider-API spend/abuse.
paymentsRouter.post(
  "/initialize",
  authenticate,
  requireRole("passenger"),
  rateLimit({ keyPrefix: "payment-init", max: 20, windowSec: 60 }),
  validateBody(initializeSchema),
  paymentsController.initialize
);

// Frontend polls this after Paystack redirects back with ?reference=
paymentsRouter.get(
  "/verify/:reference",
  authenticate,
  requireRole("passenger"),
  paymentsController.verify
);
