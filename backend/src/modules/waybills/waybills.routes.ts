import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateId, validateQuery } from "../../middleware/validate";
import { waybillsController } from "./waybills.controller";
import { createWaybillSchema, sendQuoteSchema, updateStatusSchema, listWaybillsQuerySchema } from "./waybills.schema";

export const waybillsRouter = Router();

// ---------------------------------------------------------------------------
// NOTE: Route ordering matters — more-specific paths BEFORE parameterized ones.
// /mine must come before /:no so the literal "mine" is not treated as a waybill#.
// ---------------------------------------------------------------------------

// Customer: list own waybills
waybillsRouter.get(
  "/mine",
  authenticate,
  validateQuery(listWaybillsQuerySchema),
  waybillsController.listMyWaybills
);

// Admin / operator: list all waybills
waybillsRouter.get(
  "/",
  authenticate,
  requireRole("admin", "operator"),
  validateQuery(listWaybillsQuerySchema),
  waybillsController.listWaybills
);

// Customer: create waybill request (no payment yet)
waybillsRouter.post(
  "/",
  authenticate,
  validateBody(createWaybillSchema),
  waybillsController.createWaybill
);

// Admin: send quote + assign operator
waybillsRouter.patch(
  "/:id/quote",
  authenticate,
  requireRole("admin"),
  validateId,
  validateBody(sendQuoteSchema),
  waybillsController.sendQuote
);

// Customer: initiate Paystack payment (after quote)
waybillsRouter.post(
  "/:id/pay",
  authenticate,
  validateId,
  waybillsController.initiatePay
);

// Customer: verify payment after returning from Paystack (webhook-independent).
// Literal "verify" segment is distinct from POST /:id/pay (whose 2nd segment
// must be "pay"), so there is no route collision.
waybillsRouter.post(
  "/verify/:reference",
  authenticate,
  waybillsController.verifyPayment
);

// Admin / operator: update lifecycle status
waybillsRouter.patch(
  "/:id/status",
  authenticate,
  requireRole("admin", "operator"),
  validateId,
  validateBody(updateStatusSchema),
  waybillsController.updateStatus
);

// Public unauthenticated tracking — MUST be last among GET routes
waybillsRouter.get("/:no", waybillsController.trackWaybill);
