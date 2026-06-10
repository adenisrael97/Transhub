/**
 * HTTP layer for trips. Reads req, calls the service, sends res.
 * No business logic — Express 5 forwards async errors automatically.
 */
import type { Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../../shared/errors";
import { tripsService } from "./trips.service";
import { bookingsService } from "../bookings";
import {
  searchTripsQuerySchema,
  listTripsQuerySchema,
  type CreateTripInput,
  type ToggleTripInput,
  type MarkFullInput,
  type SetOfflineCountInput,
} from "./trips.schema";

type IdParam = { id: string };

export const tripsController = {
  /** POST /trips — operator only. operatorId read from JWT, never from body. */
  async create(req: Request, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) {
      throw new ForbiddenError("Your account is not linked to an operator profile");
    }
    const trip = await tripsService.create(req.body as CreateTripInput, operatorId);
    res.status(201).json({ trip });
  },

  /**
   * GET /trips/search — no auth required.
   * Re-parse the query here so Zod's coercion + defaults (e.g. passengers) are
   * applied: validateQuery validates but does not write the parsed value back
   * (Express 5 query is getter-only), so req.query still holds raw strings.
   */
  async search(req: Request, res: Response): Promise<void> {
    const query = searchTripsQuerySchema.parse(req.query);
    const result = await tripsService.search(query);
    res.json(result);
  },

  /** GET /trips/:id — no auth required. */
  async getById(req: Request<IdParam>, res: Response): Promise<void> {
    const trip = await tripsService.getById(req.params.id);
    res.json({ trip });
  },

  /**
   * GET /trips — admin or operator. Paginated via ?page=&limit=.
   * Admin sees all trips (may filter by ?operatorId=); operator sees only their
   * own (scoped from the JWT, ignoring any operatorId in the query).
   */
  async list(req: Request, res: Response): Promise<void> {
    // Re-parse: validateQuery guards but can't write back to the getter-only
    // Express 5 req.query, so coercion/defaults aren't applied there.
    const { operatorId: queryOperatorId, page, limit, search } = listTripsQuerySchema.parse(req.query);

    let operatorId = queryOperatorId;
    if (req.user!.role === "operator") {
      operatorId = req.user!.operatorId;
      if (!operatorId) {
        throw new ForbiddenError("Your account is not linked to an operator profile");
      }
    }
    const result = await tripsService.list({ operatorId, search }, { page, limit });
    res.json(result);
  },

  /** GET /trips/mine — driver only. Returns trips assigned to this driver (by Driver.id FK). */
  async driverTrips(req: Request, res: Response): Promise<void> {
    const driverId = req.user?.id;
    if (!driverId) throw new ForbiddenError("Driver account ID not found");
    const trips = await tripsService.listByDriver(driverId);
    res.json({ trips });
  },

  /** PATCH /trips/:id/active — operator only. Toggles trip online/offline. */
  async toggleActive(req: Request<IdParam>, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) {
      throw new ForbiddenError("Your account is not linked to an operator profile");
    }
    const { isActive } = req.body as ToggleTripInput;
    const trip = await tripsService.toggleActive(req.params.id, operatorId, isActive);
    res.json({ trip });
  },

  /** DELETE /trips/:id — operator only. Ownership enforced in service + repository. */
  async remove(req: Request<IdParam>, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) {
      throw new ForbiddenError("Your account is not linked to an operator profile");
    }
    await tripsService.delete(req.params.id, operatorId);
    res.status(204).send();
  },

  /** PATCH /trips/:id/fill — operator, admin, or driver. Marks a trip full or reopens it. */
  async markFull(req: Request<IdParam>, res: Response): Promise<void> {
    const role       = req.user!.role;
    const operatorId = req.user?.operatorId;
    // driverId is req.user.id when the caller is a driver (drivers table PK in JWT)
    const driverId   = role === "driver" ? req.user!.id : undefined;

    if (role !== "admin" && role !== "driver" && !operatorId) {
      throw new ForbiddenError("Your account is not linked to an operator profile");
    }

    const { isFull } = req.body as MarkFullInput;
    const trip = await tripsService.markFull(req.params.id, operatorId, role, isFull, driverId);
    res.json({ trip });
  },

  /** PATCH /trips/:id/offline — operator, admin, or driver. Sets the offline (walk-in) count. */
  async setOfflineCount(req: Request<IdParam>, res: Response): Promise<void> {
    const role       = req.user!.role;
    const operatorId = req.user?.operatorId;
    const driverId   = role === "driver" ? req.user!.id : undefined;

    if (role !== "admin" && role !== "driver" && !operatorId) {
      throw new ForbiddenError("Your account is not linked to an operator profile");
    }

    const { offlineCount } = req.body as SetOfflineCountInput;
    const trip = await tripsService.setOfflineCount(req.params.id, operatorId, role, offlineCount, driverId);
    res.json({ trip });
  },

  /** GET /trips/:id/passengers — operator, driver, or admin. Passenger list for the trip. */
  async getTripPassengers(req: Request<IdParam>, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const passengers = await bookingsService.getPassengersByTripId(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.json({ passengers });
  },
};
