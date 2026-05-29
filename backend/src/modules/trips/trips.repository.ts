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
import type { CreateTripInput } from "./trips.schema";

type Tx = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Internal Prisma includes — keep select shapes DRY across queries.
// ---------------------------------------------------------------------------

// List/search: pull only seat STATUS to compute availableSeats. The seat array
// itself is never returned to the client (no per-seat exposure, no payload bloat
// of up to 100 seat objects per trip across a search result page).
const TRIP_FOR_LIST = {
  operator: { select: { companyName: true } },
  seats:    { select: { status: true } },
} satisfies Prisma.TripInclude;

// Detail: full seat map (id, label, status) for the seat-selection UI.
const TRIP_WITH_SEATS = {
  operator: { select: { companyName: true } },
  seats:    { orderBy: { label: "asc" as const } },
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
  // The driver's phone number is PII. Present only on authenticated operator/admin
  // responses; omitted from public search + trip-detail so it isn't scraped.
  driverNumber?:  string | null;
  status:         string;
  createdAt:      string;
}

export interface TripDetailDTO extends TripDTO {
  seats: SeatDTO[];
}

export interface SeatDTO {
  id:       string;
  label:    string;
  isBooked: boolean;
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
  driverNumber: string | null;
  status:       string;
  operatorId:   string;
  createdAt:    Date;
  updatedAt:    Date;
  operator:     { companyName: string };
};

type RawTripForList = RawTrip & {
  seats: { status: string }[];
};

type RawTripWithSeats = RawTrip & {
  seats: { id: string; label: string; status: string }[];
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
    ...(exposeDriver ? { driverNumber: raw.driverNumber } : {}),
    status:         raw.status,
    createdAt:      raw.createdAt.toISOString(),
  };
}

/** List/search DTO: counts only, no seat array. */
function toListDTO(raw: RawTripForList, exposeDriver: boolean): TripDTO {
  const availableSeats = raw.seats.filter((s) => s.status === "available").length;
  return baseDTO(raw, availableSeats, exposeDriver);
}

/** Detail DTO: full seat map for the seat-selection UI. */
function toDetailDTO(raw: RawTripWithSeats, exposeDriver: boolean): TripDetailDTO {
  const availableSeats = raw.seats.filter((s) => s.status === "available").length;
  return {
    ...baseDTO(raw, availableSeats, exposeDriver),
    seats: raw.seats.map((s) => ({
      id:       s.id,
      label:    s.label,
      isBooked: s.status !== "available",
    })),
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
export const tripsRepository = {
  /**
   * Create a trip + auto-generate all its seat rows in one transaction.
   * operatorId comes from the JWT, not the request body.
   */
  async create(data: CreateTripInput, operatorId: string, tx?: Tx): Promise<TripDetailDTO> {
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
        driverNumber:  data.driverNumber ?? null,
        operatorId,
        seats: {
          createMany: { data: labels.map((label) => ({ label })) },
        },
      },
      include: TRIP_WITH_SEATS,
    });

    // Operator's own freshly-created trip — they may see the driver number.
    return toDetailDTO(trip as unknown as RawTripWithSeats, true);
  },

  /** Get a single trip with its full seat map. Public endpoint — no driver PII. */
  async findById(id: string, tx?: Tx): Promise<TripDetailDTO | null> {
    const trip = await (tx ?? prisma).trip.findUnique({
      where:   { id },
      include: TRIP_WITH_SEATS,
    });
    if (!trip) return null;
    return toDetailDTO(trip as unknown as RawTripWithSeats, false);
  },

  /** Passenger search: case-insensitive route + date + minimum availability filter. */
  async search(params: {
    from:         string;
    to:           string;
    date:         string;
    minAvailable: number;
  }): Promise<TripDTO[]> {
    const { start: dayStart, end: dayEnd } = watDayBounds(params.date);

    const trips = await prisma.trip.findMany({
      where: {
        from:          { equals: params.from, mode: "insensitive" },
        to:            { equals: params.to,   mode: "insensitive" },
        departureTime: { gte: dayStart, lte: dayEnd },
        status:        { in: ["scheduled", "active"] },
      },
      include: TRIP_FOR_LIST,
      orderBy: { departureTime: "asc" },
    });

    // Public search — no driver PII in the results.
    return trips
      .map((t) => toListDTO(t as unknown as RawTripForList, false))
      .filter((t) => t.availableSeats >= params.minAvailable);
  },

  /** A page of trips, optionally filtered by operator. Operator/admin only — driver shown. */
  async findAll(filter: { operatorId?: string }, pagination: PaginationQuery): Promise<Page<TripDTO>> {
    const where = filter.operatorId ? { operatorId: filter.operatorId } : undefined;
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
   * Delete a trip only if it belongs to operatorId (ownership check in WHERE).
   * Returns the number of deleted rows — 0 means not found or not owned.
   */
  async delete(id: string, operatorId: string): Promise<number> {
    const result = await prisma.trip.deleteMany({
      where: { id, operatorId },
    });
    return result.count;
  },
};
