import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { validateQuery } from "../../middleware/validate";
import { transactionsController } from "./transactions.controller";
import { listTransactionsQuerySchema } from "./transactions.schema";

export const transactionsRouter = Router();

// Admin + operator + passenger: paginated/filterable/searchable transactions feed.
// The service hard-scopes operators to their operatorId and passengers to their
// own userId, so a client can never read another party's transactions.
transactionsRouter.get(
  "/",
  authenticate,
  requireRole("admin", "operator", "passenger"),
  validateQuery(listTransactionsQuerySchema),
  transactionsController.list
);
