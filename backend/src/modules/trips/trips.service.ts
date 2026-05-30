/**
 * Trips business logic.
 * Operators create/delete their own trips. Admins + operators list trips (read).
 * Passengers search public trips and view trip detail.
 */
import { ConflictError, NotFoundError } from "../../shared/errors";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import { operatorsService } from "../operators";
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

  /** Driver: fetch all trips assigned to this driver (matched by phone → driverNumber). */
  listByDriver(phone: string): Promise<TripDTO[]> {
    return tripsRepository.listByDriver(phone);
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
   * Operator/admin manually marks a trip as full or reopens it.
   * Admin (role="admin") bypasses ownership check (operatorId=undefined).
   */
  async markFull(id: string, operatorId: string | undefined, role: string, isFull: boolean): Promise<TripDTO> {
    const ownerFilter = role === "admin" ? undefined : operatorId;
    const trip = await tripsRepository.markFull(id, ownerFilter, isFull);
    if (!trip) throw new NotFoundError("Trip not found");
    eventBus.emit("trip.capacityChanged", { tripId: id, isFull, offlineCount: trip.offlineCount });
    return trip;
  },

  /**
   * Operator/admin sets the absolute offline (walk-in) booking count.
   * Validates the count doesn't exceed totalSeats, then auto-marks full if needed.
   */
  async setOfflineCount(id: string, operatorId: string | undefined, role: string, offlineCount: number): Promise<TripDTO> {
    const ownerFilter = role === "admin" ? undefined : operatorId;

    // Fetch current trip to validate count and check available seats
    const current = await tripsRepository.findById(id);
    if (!current) throw new NotFoundError("Trip not found");
    if (offlineCount > current.totalSeats) {
      throw new ConflictError("Offline count cannot exceed total seats");
    }

    // Auto-mark full if online + offline bookings exhaust capacity
    const dbAvailable = await tripsRepository.countAvailableSeats(id);
    const effectiveAvailable = dbAvailable - offlineCount;
    const autoFull = effectiveAvailable <= 0 && !current.isFull;

    const trip = await tripsRepository.setOfflineCount(id, ownerFilter, offlineCount, autoFull);
    if (!trip) throw new NotFoundError("Trip not found");

    eventBus.emit("trip.capacityChanged", {
      tripId: id,
      isFull: trip.isFull,
      offlineCount,
    });
    return trip;
  },
};
