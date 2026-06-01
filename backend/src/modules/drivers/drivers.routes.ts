/**
 * Driver management routes — all operator-only.
 * Operators create and manage drivers; drivers cannot self-register.
 *
 *   POST   /drivers          — create a driver (operator only)
 *   GET    /drivers          — list this operator's drivers (operator only)
 *   GET    /drivers/:id      — get driver detail (operator only)
 *   PATCH  /drivers/:id      — update driver fields (operator only)
 *   DELETE /drivers/:id      — deactivate driver (operator only, soft-delete)
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateId } from "../../middleware/validate";
import { driversController } from "./drivers.controller";
import { createDriverSchema, updateDriverSchema } from "./drivers.schema";

export const driversRouter = Router();

driversRouter.post(
  "/",
  authenticate,
  requireRole("operator"),
  validateBody(createDriverSchema),
  driversController.create
);

driversRouter.get(
  "/",
  authenticate,
  requireRole("operator"),
  driversController.list
);

driversRouter.get(
  "/:id",
  validateId,
  authenticate,
  requireRole("operator"),
  driversController.getById
);

driversRouter.patch(
  "/:id",
  validateId,
  authenticate,
  requireRole("operator"),
  validateBody(updateDriverSchema),
  driversController.update
);

// DELETE soft-deletes (sets isActive=false); the driver row is never hard-deleted
// so FK references on trips remain valid.
driversRouter.delete(
  "/:id",
  validateId,
  authenticate,
  requireRole("operator"),
  driversController.deactivate
);
