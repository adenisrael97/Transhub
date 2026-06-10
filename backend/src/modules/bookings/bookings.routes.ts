import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateQuery, validateId } from "../../middleware/validate";
import { holdSchema, listBookingsQuerySchema } from "./bookings.schema";
import { bookingsController } from "./bookings.controller";

export const bookingsRouter = Router();

// Passenger holds seats before payment
bookingsRouter.post(
  "/hold",
  authenticate,
  requireRole("passenger"),
  validateBody(holdSchema),
  bookingsController.hold
);

// NOTE: there is intentionally NO public "confirm" route. A booking is only ever
// confirmed server-side by the verified Paystack webhook (signature + amount
// recomputed from the DB) — see payments.handleWebhook → bookingsService.confirm.
// Exposing confirm to clients would let a passenger book seats without paying.

// List bookings — passenger sees own, admin sees all, operator sees their trips
bookingsRouter.get(
  "/",
  authenticate,
  requireRole("passenger", "admin", "operator"),
  validateQuery(listBookingsQuerySchema),
  bookingsController.list
);

// Booking detail — owner or admin
bookingsRouter.get(
  "/:id",
  validateId,
  authenticate,
  requireRole("passenger", "admin"),
  bookingsController.getById
);
