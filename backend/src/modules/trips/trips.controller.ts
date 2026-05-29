/**
 * HTTP layer for trips. Reads req, calls the service, sends res.
 * No business logic — Express 5 forwards async errors automatically.
 */
import type { Request, Response } from "express";
import { ForbiddenError } from "../../shared/errors";
import { tripsService } from "./trips.service";
import {
  searchTripsQuerySchema,
  listTripsQuerySchema,
  type CreateTripInput,
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
    const trips = await tripsService.search(query);
    res.json({ trips });
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
    const { operatorId: queryOperatorId, page, limit } = listTripsQuerySchema.parse(req.query);

    let operatorId = queryOperatorId;
    if (req.user!.role === "operator") {
      operatorId = req.user!.operatorId;
      if (!operatorId) {
        // Guard against a malformed operator token falling through to an
        // unfiltered query that would expose every operator's trips.
        throw new ForbiddenError("Your account is not linked to an operator profile");
      }
    }
    const result = await tripsService.list({ operatorId }, { page, limit });
    res.json(result);
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
};
