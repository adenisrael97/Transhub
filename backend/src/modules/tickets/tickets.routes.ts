import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { validateQuery } from "../../middleware/validate";
import { paginationQuerySchema } from "../../shared/pagination";
import { ticketsController } from "./tickets.controller";

export const ticketsRouter = Router();

// A passenger's own tickets (confirmed bookings) — paginated via ?page=&limit=
ticketsRouter.get(
  "/",
  authenticate,
  requireRole("passenger"),
  validateQuery(paginationQuerySchema),
  ticketsController.list
);

// A single ticket — ownership enforced in the service (404 on miss/foreign).
ticketsRouter.get(
  "/:bookingId",
  authenticate,
  requireRole("passenger"),
  ticketsController.get
);
