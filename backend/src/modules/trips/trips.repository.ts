/**
 * Trips + Seats data access — the ONLY place that touches `trips` and `seats` tables.
 * (Table-ownership rule: this module owns both tables.)
 *
 * operatorId is a separate argument to create() — it comes from the JWT, not the
 * request body, so it never enters the Zod schema.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";
import { toNumberRange } from "../../shared/list-query";
import type { CreateTripInput } from "./trips.schema";

type Tx = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Internal Prisma includes — keep select shapes DRY across queries.
// ---------------------------------------------------------------------------

// List/search: count available seats in the DB via a filtered relation count
// (uses the (tripId, status) index) instead of loading every seat row just to
// count them in JS. At ~100 seats/trip across a result page this avoids pulling
// thousands of rows on the hottest endpoint. The seat array is never returned to
// the client anyway (no per-seat exposure, no payload bloat).
const TRIP_FOR_LIST = {
  operator: { select: { companyName: true } },
  _count:   { select: { seats: { where: { status: "available" } } } },
} satisfies Prisma.TripInclude;


// ---------------------------------------------------------------------------
// DTO types — what callers (service) work with, not raw Prisma models.
// ---------------------------------------------------------------------------
export interface TripDTO {
  id:             string;
  from:           string;
  to:             string;
  departureTime:  string;
  arrivalTime:    string | null;
  operator:       string;
  operatorId:     string;
  price:          number;
  totalSeats:     number;
  availableSeats: number;
  vehicleType:    string;
  // driverId is PII-adjacent. Present only on authenticated operator/admin/driver
  // responses; omitted from public search + trip-detail to prevent scraping.
  driverId?:      string | null;
  parkName:       string | null;
  amenities:      string[];
  status:         string;
  isActive:       boolean;
  isFull:         boolean;
  offlineCount:   number;
  createdAt:      string;
}

// ---------------------------------------------------------------------------
// Time zone
// ---------------------------------------------------------------------------
//
// TransHub operates in Nigeria, which uses WAT (West Africa Time) — a fixed
// UTC+1 offset with no daylight saving. The operator's datetime-local input and
// the passenger's search date arrive WITHOUT a timezone, so we anchor both to
// WAT explicitly. This makes stored instants and search day-boundaries identical
// regardless of the server's own timezone (a UTC container, a laptop in WAT, etc.)
// — `new Date("2026-07-20T07:00")` alone would silently depend on the host TZ.
const WAT_OFFSET = "+01:00";

/** Has the string an explicit timezone designator (Z or ±HH:MM) on the time part? */
function hasTimezone(value: string): boolean {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(value.trim());
}

/** Interpret a timezone-less datetime string as Nigeria time (WAT). */
function parseWatDateTime(value: string): Date {
  const v = value.trim();
  return new Date(hasTimezone(v) ? v : `${v}${WAT_OFFSET}`);
}

/** Inclusive UTC bounds for a calendar day (YYYY-MM-DD) as it falls in WAT. */
function watDayBounds(date: string): { start: Date; end: Date } {
  return {
    start: new Date(`${date}T00:00:00.000${WAT_OFFSET}`),
    end:   new Date(`${date}T23:59:59.999${WAT_OFFSET}`),
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Seat labels: A1–A4, B1–B4, … (4 per row, up to 100 seats). */
function generateSeatLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const row = String.fromCharCode(65 + Math.floor(i / 4));
    const col = (i % 4) + 1;
    return `${row}${col}`;
  });
}

type RawTrip = {
  id:           string;
  from:         string;
  to:           string;
  departureTime: Date;
  arrivalTime:  Date | null;
  price:        number;
  totalSeats:   number;
  vehicleType:  string;
  driverId:     string | null;
  parkName:     string | null;
  amenities:    string[];
  status:       string;
  isActive:     boolean;
  isFull:       boolean;
  offlineCount: number;
  operatorId:   string;
  createdAt:    Date;
  updatedAt:    Date;
  operator:     { companyName: string };
};

type RawTripForList = RawTrip & {
  _count: { seats: number }; // DB-computed count of seats WHERE status='available'
};

/**
 * Map shared scalar fields once; list and detail DTOs both build on this.
 * `exposeDriver` gates the driver's phone number: true only for authenticated
 * operator/admin responses, false for public search + trip detail.
 */
function baseDTO(raw: RawTrip, availableSeats: number, exposeDriver: boolean): TripDTO {
  return {
    id:             raw.id,
    from:           raw.from,
    to:             raw.to,
    departureTime:  raw.departureTime.toISOString(),
    arrivalTime:    raw.arrivalTime?.toISOString() ?? null,
    operator:       raw.operator.companyName,
    operatorId:     raw.operatorId,
    price:          raw.price,
    totalSeats:     raw.totalSeats,
    availableSeats,
    vehicleType:    raw.vehicleType,
    ...(exposeDriver ? { driverId: raw.driverId } : {}),
    parkName:       raw.parkName,
    amenities:      raw.amenities,
    status:         raw.status,
    isActive:       raw.isActive,
    isFull:         raw.isFull,
    offlineCount:   raw.offlineCount,
    createdAt:      raw.createdAt.toISOString(),
  };
}

/** List/search/detail DTO: an available-seat count only — no per-seat data is
 * ever exposed (seatless booking; the client only needs the count).
 * Subtract offlineCount so walk-in bookings reduce the displayed availability. */
function toListDTO(raw: RawTripForList, exposeDriver: boolean): TripDTO {
  const availableSeats = Math.max(0, raw._count.seats - raw.offlineCount);
  return baseDTO(raw, availableSeats, exposeDriver);
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
export const tripsRepository = {
  /**
   * Create a trip + auto-generate all its seat rows in one transaction.
   * operatorId comes from the JWT, not the request body.
   */
  async create(data: CreateTripInput, operatorId: string, tx?: Tx): Promise<TripDTO> {
    const client = tx ?? prisma;
    const labels = generateSeatLabels(data.totalSeats);

    const trip = await client.trip.create({
      data: {
        from:          data.from,
        to:            data.to,
        departureTime: parseWatDateTime(data.departureTime),
        arrivalTime:   data.arrivalTime ? parseWatDateTime(data.arrivalTime) : null,
        price:         data.price,
        totalSeats:    data.totalSeats,
        vehicleType:   data.vehicleType,
        driverId:      data.driverId ?? null,
        parkName:      data.parkName ?? null,
        amenities:     data.amenities ?? [],
        operatorId,
        seats: {
          createMany: { data: labels.map((label) => ({ label })) },
        },
      },
      include: TRIP_FOR_LIST,
    });

    // Operator's own freshly-created trip — they may see the driver number.
    return toListDTO(trip as unknown as RawTripForList, true);
  },

  /** Get a single trip with its available-seat count. Public endpoint — no driver PII. */
  async findById(id: string, tx?: Tx): Promise<TripDTO | null> {
    const trip = await (tx ?? prisma).trip.findUnique({
      where:   { id },
      include: TRIP_FOR_LIST,
    });
    if (!trip) return null;
    return toListDTO(trip as unknown as RawTripForList, false);
  },

  /**
   * Passenger search: route + date + refinement filters (vehicle type, price band,
   * amenities, operator) with sort and pagination.
   *
   * All filters except availability run in SQL: route/date/status hit the
   * (from, to, departureTime) btree index; price/vehicleType/operatorId/amenities
   * narrow further. The minimum-availability filter (`availableSeats >= passengers`)
   * runs in JS because availableSeats = COUNT(available seats) − offlineCount, a
   * derived value Prisma can't express in WHERE. A single route+date is a bounded
   * result set, so we cap the DB fetch defensively and paginate the filtered list.
   */
  async search(params: {
    from:         string;
    to:           string;
    date:         string;
    minAvailable: number;
    vehicleType?: string;
    minPrice?:    number;
    maxPrice?:    number;
    amenities?:   string[];
    operatorId?:  string;
    sort:         "departure" | "price_asc" | "price_desc";
    page:         number;
    limit:        number;
  }): Promise<Page<TripDTO>> {
    const { start: dayStart, end: dayEnd } = watDayBounds(params.date);

    const priceRange = toNumberRange(params.minPrice, params.maxPrice);

    // Exact (case-sensitive) match: params.from/to arrive already canonicalized
    // by normalizeCity (search schema transform) and stored values are canonical
    // too, so this uses the (from, to, departureTime) btree index instead of the
    // un-indexable ILIKE that `mode:"insensitive"` would emit.
    const where: Prisma.TripWhereInput = {
      from:          params.from,
      to:            params.to,
      departureTime: { gte: dayStart, lte: dayEnd },
      status:        { in: ["scheduled", "active"] },
      isActive:      true,
      isFull:        false,
      ...(params.vehicleType ? { vehicleType: params.vehicleType } : {}),
      ...(priceRange ? { price: priceRange } : {}),
      ...(params.amenities && params.amenities.length ? { amenities: { hasEvery: params.amenities } } : {}),
      ...(params.operatorId ? { operatorId: params.operatorId } : {}),
    };

    const orderBy: Prisma.TripOrderByWithRelationInput[] =
      params.sort === "price_asc"  ? [{ price: "asc" },  { departureTime: "asc" }] :
      params.sort === "price_desc" ? [{ price: "desc" }, { departureTime: "asc" }] :
      [{ departureTime: "asc" }];

    const trips = await prisma.trip.findMany({
      where,
      include: TRIP_FOR_LIST,
      orderBy,
      take: 500, // safety cap — one route on one day never approaches this
    });

    // Public search — no driver PII in the results. Availability filter is the
    // only post-query step; everything else was narrowed in SQL.
    const filtered = trips
      .map((t) => toListDTO(t as unknown as RawTripForList, false))
      .filter((t) => t.availableSeats >= params.minAvailable);

    const { skip, take } = toSkipTake({ page: params.page, limit: params.limit });
    return { items: filtered.slice(skip, skip + take), total: filtered.length };
  },

  /**
   * Driver view: trips assigned to this driver (matched by FK driverId),
   * bounded to today's boarding-relevant window (computed server-side —
   * from 4h ago through end of current day so a driver's device clock
   * can't make a trip wrongly appear or disappear). Ordered soonest-first
   * so the active trip sits at the top of the dashboard.
   */
  async listByDriver(driverId: string, window?: { from: Date; to: Date }): Promise<TripDTO[]> {
    const trips = await prisma.trip.findMany({
      where: {
        driverId,
        ...(window ? { departureTime: { gte: window.from, lte: window.to } } : {}),
      },
      include: TRIP_FOR_LIST,
      orderBy: { departureTime: "asc" },
    });
    return trips.map((t) => toListDTO(t as unknown as RawTripForList, true));
  },

  /** A page of trips, optionally filtered by operator and/or city search. Operator/admin only. */
  async findAll(
    filter: { operatorId?: string; search?: string },
    pagination: PaginationQuery
  ): Promise<Page<TripDTO>> {
    const where: import("@prisma/client").Prisma.TripWhereInput = {};
    if (filter.operatorId) where.operatorId = filter.operatorId;
    if (filter.search) {
      where.OR = [
        { from: { contains: filter.search, mode: "insensitive" } },
        { to:   { contains: filter.search, mode: "insensitive" } },
      ];
    }
    const [trips, total] = await prisma.$transaction([
      prisma.trip.findMany({
        where,
        include: TRIP_FOR_LIST,
        orderBy: { departureTime: "desc" },
        ...toSkipTake(pagination),
      }),
      prisma.trip.count({ where }),
    ]);
    return {
      items: trips.map((t) => toListDTO(t as unknown as RawTripForList, true)),
      total,
    };
  },

  /**
   * Toggle isActive for a trip owned by operatorId.
   * Uses updateMany with ownership in WHERE — returns null if not found or not owned.
   */
  async toggleActive(id: string, operatorId: string, isActive: boolean): Promise<TripDTO | null> {
    const result = await prisma.trip.updateMany({
      where: { id, operatorId },
      data:  { isActive },
    });
    if (result.count === 0) return null;
    const trip = await prisma.trip.findUnique({ where: { id }, include: TRIP_FOR_LIST });
    if (!trip) return null;
    return toListDTO(trip as unknown as RawTripForList, true);
  },

  /**
   * Delete a trip only if it belongs to operatorId (ownership check in WHERE).
   * Returns the number of deleted rows — 0 means not found or not owned.
   */
  async delete(id: string, operatorId: string): Promise<number> {
    const result = await prisma.trip.deleteMany({
      where: { id, operatorId },
    });
    return result.count;
  },

  /**
   * Manually mark a trip full (or reopen it).
   * ownerFilter is undefined for admin (bypass ownership), { operatorId } for operators,
   * or { driverId } for drivers (who can only mark trips assigned to them).
   * Returns null if the trip was not found or not owned by the filter.
   */
  async markFull(
    id: string,
    ownerFilter: { operatorId?: string; driverId?: string } | undefined,
    isFull: boolean
  ): Promise<TripDTO | null> {
    const where = ownerFilter ? { id, ...ownerFilter } : { id };
    const result = await prisma.trip.updateMany({ where, data: { isFull } });
    if (result.count === 0) return null;
    const trip = await prisma.trip.findUnique({ where: { id }, include: TRIP_FOR_LIST });
    if (!trip) return null;
    return toListDTO(trip as unknown as RawTripForList, true);
  },

  /**
   * Record the absolute count of offline (walk-in) bookings for a trip.
   * ownerFilter is undefined for admin, { operatorId } for operators,
   * or { driverId } for drivers.
   * Returns null if the trip was not found or not owned.
   */
  async setOfflineCount(
    id: string,
    ownerFilter: { operatorId?: string; driverId?: string } | undefined,
    offlineCount: number,
    autoFull: boolean
  ): Promise<TripDTO | null> {
    const where = ownerFilter ? { id, ...ownerFilter } : { id };
    const data: { offlineCount: number; isFull?: boolean } = { offlineCount };
    if (autoFull) data.isFull = true;
    const result = await prisma.trip.updateMany({ where, data });
    if (result.count === 0) return null;
    const trip = await prisma.trip.findUnique({ where: { id }, include: TRIP_FOR_LIST });
    if (!trip) return null;
    return toListDTO(trip as unknown as RawTripForList, true);
  },

  /** Raw seat availability count for a trip (used by setOfflineCount to detect auto-full). */
  async countAvailableSeats(id: string): Promise<number> {
    return prisma.seat.count({ where: { tripId: id, status: "available" } });
  },
};
