/** Operator routes. Public: register. Admin-only: list, approve, decline. */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { rateLimit } from "../../middleware/rate-limit";
import { validateBody, validateQuery, validateId } from "../../middleware/validate";
import { operatorsController } from "./operators.controller";
import {
  listOperatorsQuerySchema,
  registerOperatorSchema,
  updateOperatorProfileSchema,
} from "./operators.schema";

export const operatorsRouter = Router();

// Operator self-service — must be declared BEFORE /:id routes so "me" is
// never matched as a UUID param.
operatorsRouter.get(
  "/me",
  authenticate,
  requireRole("operator"),
  operatorsController.getMyProfile
);

operatorsRouter.patch(
  "/me",
  authenticate,
  requireRole("operator"),
  validateBody(updateOperatorProfileSchema),
  operatorsController.updateMyProfile
);

// Public: approved operators for the passenger search "Transport Company" filter.
// No auth — only id + companyName are exposed. Declared BEFORE /:id routes.
operatorsRouter.get("/public", operatorsController.listPublic);

// Anyone can submit an application — no auth required, so throttle per IP.
operatorsRouter.post(
  "/register",
  rateLimit({ keyPrefix: "operator-register", max: 5, windowSec: 60 }),
  validateBody(registerOperatorSchema),
  operatorsController.register
);

// Admin: compact list of approved operators for dropdowns (e.g. waybill assignment).
// Must be declared BEFORE /:id routes.
operatorsRouter.get(
  "/approved",
  authenticate,
  requireRole("admin"),
  operatorsController.listApproved
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
  validateId,
  authenticate,
  requireRole("admin"),
  operatorsController.approve
);

operatorsRouter.patch(
  "/:id/decline",
  validateId,
  authenticate,
  requireRole("admin"),
  operatorsController.decline
);
