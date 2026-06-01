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
import { validateBody, validateQuery, validateId } from "../../middleware/validate";
import { tripsController } from "./trips.controller";
import {
  createTripSchema,
  searchTripsQuerySchema,
  listTripsQuerySchema,
  toggleTripSchema,
  markFullSchema,
  setOfflineCountSchema,
} from "./trips.schema";

export const tripsRouter = Router();

// Public — no auth
tripsRouter.get(
  "/search",
  validateQuery(searchTripsQuerySchema),
  tripsController.search
);

// Driver: list own trips (matched by phone → driverNumber)
tripsRouter.get(
  "/mine",
  authenticate,
  requireRole("driver"),
  tripsController.driverTrips
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

// Operator: toggle trip online/offline (before /:id so /:id/active isn't ambiguous)
tripsRouter.patch(
  "/:id/active",
  validateId,
  authenticate,
  requireRole("operator"),
  validateBody(toggleTripSchema),
  tripsController.toggleActive
);

// Operator + Admin + Driver: manually mark a trip full or reopen it
tripsRouter.patch(
  "/:id/fill",
  validateId,
  authenticate,
  requireRole("operator", "admin", "driver"),
  validateBody(markFullSchema),
  tripsController.markFull
);

// Operator + Admin + Driver: set the offline (walk-in) booking count
tripsRouter.patch(
  "/:id/offline",
  validateId,
  authenticate,
  requireRole("operator", "admin", "driver"),
  validateBody(setOfflineCountSchema),
  tripsController.setOfflineCount
);

// Operator + Driver + Admin: passenger list for a trip (before /:id)
tripsRouter.get(
  "/:id/passengers",
  validateId,
  authenticate,
  requireRole("operator", "driver", "admin"),
  tripsController.getTripPassengers
);

// Public — no auth (AFTER /search and / to prevent wildcard shadowing)
tripsRouter.get("/:id", validateId, tripsController.getById);

// Operator: delete own trip
tripsRouter.delete(
  "/:id",
  validateId,
  authenticate,
  requireRole("operator"),
  tripsController.remove
);
