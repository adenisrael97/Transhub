import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateId, validateQuery } from "../../middleware/validate";
import { rateLimit } from "../../middleware/rate-limit";
import { chartersController } from "./charters.controller";
import { createCharterSchema, sendQuoteSchema, confirmBookingSchema, listChartersQuerySchema } from "./charters.schema";

export const chartersRouter = Router();

// 5 charter requests per hour per passenger — blunts spam without blocking
// legitimate group travel needs (a user rarely books more than 1-2 charters/hour).
const charterCreateLimiter = rateLimit({ keyPrefix: "charter-create", max: 5, windowSec: 3600 });

// Passenger: submit a charter request
chartersRouter.post(
  "/",
  authenticate,
  requireRole("passenger"),
  charterCreateLimiter,
  validateBody(createCharterSchema),
  chartersController.createCharter
);

// Passenger: my charter history
chartersRouter.get(
  "/me",
  authenticate,
  requireRole("passenger"),
  validateQuery(listChartersQuerySchema),
  chartersController.listMyCharters
);

// Admin: all charter requests
chartersRouter.get(
  "/",
  authenticate,
  requireRole("admin"),
  validateQuery(listChartersQuerySchema),
  chartersController.listAllCharters
);

// Any auth'd user: get one charter (service enforces ownership for passengers)
chartersRouter.get(
  "/:id",
  authenticate,
  validateId,
  chartersController.getCharter
);

// Admin: send a full quote (operator info + pricing + notes) → status quote_sent
chartersRouter.patch(
  "/:id/quote",
  authenticate,
  requireRole("admin"),
  validateId,
  validateBody(sendQuoteSchema),
  chartersController.sendQuote
);

// Passenger: accept a quote → status awaiting_payment
chartersRouter.patch(
  "/:id/accept",
  authenticate,
  requireRole("passenger"),
  validateId,
  chartersController.acceptQuote
);

// Passenger: reject a quote → status cancelled
chartersRouter.patch(
  "/:id/reject",
  authenticate,
  requireRole("passenger"),
  validateId,
  chartersController.rejectQuote
);

// Passenger: initiate Paystack payment for an accepted charter
chartersRouter.post(
  "/:id/pay",
  authenticate,
  requireRole("passenger"),
  validateId,
  chartersController.initiatePayment
);

// Passenger: verify payment after returning from Paystack (webhook-independent).
// Confirms the charter via Paystack's verify API if the webhook hasn't landed yet.
chartersRouter.post(
  "/:id/verify-payment",
  authenticate,
  requireRole("passenger"),
  validateId,
  chartersController.verifyPayment
);

// Admin: update booking details post-payment (operator, pickup, travel info)
chartersRouter.patch(
  "/:id/confirm-booking",
  authenticate,
  requireRole("admin"),
  validateId,
  validateBody(confirmBookingSchema),
  chartersController.adminConfirmBooking
);

// Admin: mark charter as completed after travel date
chartersRouter.patch(
  "/:id/complete",
  authenticate,
  requireRole("admin"),
  validateId,
  chartersController.completeCharter
);

// Passenger or admin: cancel (only allowed for pending, quote_sent, awaiting_payment)
chartersRouter.delete(
  "/:id",
  authenticate,
  validateId,
  chartersController.cancelCharter
);
