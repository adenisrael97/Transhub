import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { paginationQuerySchema } from "../../shared/pagination";
import { holdSchema } from "./bookings.schema";
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

// List own bookings (passenger) or all (admin) — paginated via ?page=&limit=
bookingsRouter.get(
  "/",
  authenticate,
  requireRole("passenger", "admin"),
  validateQuery(paginationQuerySchema),
  bookingsController.list
);

// Booking detail — owner or admin
bookingsRouter.get(
  "/:id",
  authenticate,
  requireRole("passenger", "admin"),
  bookingsController.getById
);
