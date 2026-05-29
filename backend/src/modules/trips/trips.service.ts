/**
 * Trips business logic.
 * Operators create/delete their own trips. Admins + operators list trips (read).
 * Passengers search public trips and view trip detail.
 */
import { ConflictError, NotFoundError } from "../../shared/errors";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import { operatorsService } from "../operators";
import { tripsRepository, type TripDTO, type TripDetailDTO } from "./trips.repository";
import type { CreateTripInput, SearchTripsQuery } from "./trips.schema";

export const tripsService = {
  /**
   * Operator creates a trip with auto-generated seats.
   * operatorId comes from the JWT — not the request body.
   */
  async create(input: CreateTripInput, operatorId: string): Promise<TripDetailDTO> {
    const operator = await operatorsService.findById(operatorId);
    if (!operator) {
      throw new NotFoundError("Operator not found");
    }
    if (operator.status !== "approved") {
      throw new ConflictError("Only approved operators can create trips");
    }
    return tripsRepository.create(input, operatorId);
  },

  /** Passenger searches available trips by route and date. */
  search(query: SearchTripsQuery): Promise<TripDTO[]> {
    return tripsRepository.search({
      from:         query.from,
      to:           query.to,
      date:         query.date,
      minAvailable: query.passengers,
    });
  },

  /** Fetch a single trip's full detail including seat map (no auth required). */
  async getById(id: string): Promise<TripDetailDTO> {
    const trip = await tripsRepository.findById(id);
    if (!trip) throw new NotFoundError("Trip not found");
    return trip;
  },

  /**
   * List trips (paginated).
   * Admin receives all trips (no filter); operator receives only their own.
   * The controller resolves the operatorId filter from the caller's role.
   */
  async list(
    filter: { operatorId?: string },
    pagination: PaginationQuery
  ): Promise<{ trips: TripDTO[]; pagination: PageMeta }> {
    const { items, total } = await tripsRepository.findAll(filter, pagination);
    return { trips: items, pagination: pageMeta(total, pagination) };
  },

  /**
   * Operator deletes their own trip. Uses deleteMany with operatorId in the WHERE
   * clause so a delete of another operator's trip silently returns 404 — no 403
   * leak of whether the trip exists at all.
   */
  async delete(id: string, operatorId: string): Promise<void> {
    const deleted = await tripsRepository.delete(id, operatorId);
    if (deleted === 0) throw new NotFoundError("Trip not found");
  },
};
