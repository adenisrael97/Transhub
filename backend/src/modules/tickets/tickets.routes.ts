import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { validateQuery, validateBookingId } from "../../middleware/validate";
import { ticketsController, listTicketsQuerySchema } from "./tickets.controller";

export const ticketsRouter = Router();

// A passenger's own tickets (confirmed bookings) — paginated + searchable
ticketsRouter.get(
  "/",
  authenticate,
  requireRole("passenger"),
  validateQuery(listTicketsQuerySchema),
  ticketsController.list
);

// A single ticket — ownership enforced in the service (404 on miss/foreign).
ticketsRouter.get(
  "/:bookingId",
  validateBookingId,
  authenticate,
  requireRole("passenger"),
  ticketsController.get
);
