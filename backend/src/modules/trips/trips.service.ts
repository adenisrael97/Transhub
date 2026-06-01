/**
 * Trips business logic.
 * Operators create/delete their own trips. Admins + operators list trips (read).
 * Passengers search public trips and view trip detail.
 */
import { ConflictError, NotFoundError } from "../../shared/errors";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import { operatorsService } from "../operators";
import { driversService } from "../drivers";
import { eventBus } from "../../infra/events";
import { tripsRepository, type TripDTO } from "./trips.repository";
import type { CreateTripInput, SearchTripsQuery } from "./trips.schema";

export const tripsService = {
  /**
   * Operator creates a trip with auto-generated seats.
   * operatorId comes from the JWT — not the request body.
   */
  async create(input: CreateTripInput, operatorId: string): Promise<TripDTO> {
    const operator = await operatorsService.findById(operatorId);
    if (!operator) {
      throw new NotFoundError("Operator not found");
    }
    if (operator.status !== "approved") {
      throw new ConflictError("Only approved operators can create trips");
    }
    // If a driver is specified, validate they exist and belong to this operator.
    if (input.driverId) {
      const driver = await driversService.getById(input.driverId, operatorId);
      if (!driver.isActive) {
        throw new ConflictError("The assigned driver is not active");
      }
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

  /** Fetch a single trip's detail incl. available-seat count (no auth required). */
  async getById(id: string): Promise<TripDTO> {
    const trip = await tripsRepository.findById(id);
    if (!trip) throw new NotFoundError("Trip not found");
    return trip;
  },

  /**
   * Driver: trips assigned to this driver (matched by FK driverId = Driver.id),
   * bounded to today's boarding-relevant window. The window is computed on the
   * SERVER clock — from 4h ago through end of the current day — so a driver's
   * device clock can't make a trip wrongly appear or disappear.
   */
  listByDriver(driverId: string): Promise<TripDTO[]> {
    const now = new Date();
    const from = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return tripsRepository.listByDriver(driverId, { from, to });
  },

  /**
   * List trips (paginated).
   * Admin receives all trips (no filter); operator receives only their own.
   * The controller resolves the operatorId filter from the caller's role.
   */
  async list(
    filter: { operatorId?: string; search?: string },
    pagination: PaginationQuery
  ): Promise<{ trips: TripDTO[]; pagination: PageMeta }> {
    const { items, total } = await tripsRepository.findAll(filter, pagination);
    return { trips: items, pagination: pageMeta(total, pagination) };
  },

  /**
   * Operator toggles a trip online (isActive=true) or offline (isActive=false).
   * Ownership enforced in the repository via updateMany with operatorId in WHERE.
   */
  async toggleActive(id: string, operatorId: string, isActive: boolean): Promise<TripDTO> {
    const trip = await tripsRepository.toggleActive(id, operatorId, isActive);
    if (!trip) throw new NotFoundError("Trip not found");
    return trip;
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

  /**
   * Mark a trip full or reopen it.
   * - admin: no ownership filter (sees all trips)
   * - driver: scoped to trips assigned to them (driverId filter)
   * - operator: scoped to their own trips (operatorId filter)
   */
  async markFull(
    id:         string,
    operatorId: string | undefined,
    role:       string,
    isFull:     boolean,
    driverId?:  string
  ): Promise<TripDTO> {
    const ownerFilter =
      role === "admin"  ? undefined :
      role === "driver" ? { driverId } :
      { operatorId };
    const trip = await tripsRepository.markFull(id, ownerFilter, isFull);
    if (!trip) throw new NotFoundError("Trip not found");
    eventBus.emit("trip.capacityChanged", { tripId: id, isFull, offlineCount: trip.offlineCount });
    return trip;
  },

  /**
   * Set the absolute offline (walk-in) booking count for a trip.
   * Validates the count, auto-marks full if capacity is exhausted.
   * - admin: no ownership filter
   * - driver: scoped to trips assigned to them
   * - operator: scoped to their own trips
   */
  async setOfflineCount(
    id:          string,
    operatorId:  string | undefined,
    role:        string,
    offlineCount: number,
    driverId?:   string
  ): Promise<TripDTO> {
    const ownerFilter =
      role === "admin"  ? undefined :
      role === "driver" ? { driverId } :
      { operatorId };

    const current = await tripsRepository.findById(id);
    if (!current) throw new NotFoundError("Trip not found");
    if (offlineCount > current.totalSeats) {
      throw new ConflictError("Offline count cannot exceed total seats");
    }

    const dbAvailable = await tripsRepository.countAvailableSeats(id);
    const effectiveAvailable = dbAvailable - offlineCount;
    const autoFull = effectiveAvailable <= 0 && !current.isFull;

    const trip = await tripsRepository.setOfflineCount(id, ownerFilter, offlineCount, autoFull);
    if (!trip) throw new NotFoundError("Trip not found");

    eventBus.emit("trip.capacityChanged", { tripId: id, isFull: trip.isFull, offlineCount });
    return trip;
  },
};
