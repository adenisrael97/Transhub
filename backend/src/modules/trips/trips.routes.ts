/**
 * Trips routes.
 *
 * ROUTE ORDER IS CRITICAL: /search and / must be registered BEFORE /:id so the
 * literal string "search" is never treated as an id parameter.
 *
 *   Public (no auth):        GET /trips/search, GET /trips/:id
 *   Operator only:           POST /trips, DELETE /trips/:id
 *   Admin + Operator:        GET /trips
 */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { tripsController } from "./trips.controller";
import {
  createTripSchema,
  searchTripsQuerySchema,
  listTripsQuerySchema,
} from "./trips.schema";

export const tripsRouter = Router();

// Public — no auth
tripsRouter.get(
  "/search",
  validateQuery(searchTripsQuerySchema),
  tripsController.search
);

// Operator: create a trip (operatorId from JWT, not body)
tripsRouter.post(
  "/",
  authenticate,
  requireRole("operator"),
  validateBody(createTripSchema),
  tripsController.create
);

// Admin + Operator: list trips (admin sees all; operator sees own — filtered in controller)
tripsRouter.get(
  "/",
  authenticate,
  requireRole("admin", "operator"),
  validateQuery(listTripsQuerySchema),
  tripsController.list
);

// Public — no auth (AFTER /search and / to prevent wildcard shadowing)
tripsRouter.get("/:id", tripsController.getById);

// Operator: delete own trip
tripsRouter.delete(
  "/:id",
  authenticate,
  requireRole("operator"),
  tripsController.remove
);
