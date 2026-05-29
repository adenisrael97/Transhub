/** Operator routes. Public: register. Admin-only: list, approve, decline. */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { rateLimit } from "../../middleware/rate-limit";
import { validateBody, validateQuery } from "../../middleware/validate";
import { operatorsController } from "./operators.controller";
import { listOperatorsQuerySchema, registerOperatorSchema } from "./operators.schema";

export const operatorsRouter = Router();

// Anyone can submit an application — no auth required, so throttle per IP.
operatorsRouter.post(
  "/register",
  rateLimit({ keyPrefix: "operator-register", max: 5, windowSec: 60 }),
  validateBody(registerOperatorSchema),
  operatorsController.register
);

// Admin only from here down.
operatorsRouter.get(
  "/",
  authenticate,
  requireRole("admin"),
  validateQuery(listOperatorsQuerySchema),
  operatorsController.list
);

operatorsRouter.patch(
  "/:id/approve",
  authenticate,
  requireRole("admin"),
  operatorsController.approve
);

operatorsRouter.patch(
  "/:id/decline",
  authenticate,
  requireRole("admin"),
  operatorsController.decline
);
