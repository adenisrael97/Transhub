/** Zod schemas for trips. operatorId is NOT in createTripSchema — it comes from req.user (JWT). */
import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";
import { csvArray } from "../../shared/list-query";

/**
 * Canonicalize a city name: trim, collapse internal whitespace, and Title-Case
 * each word ("  port   HARCOURT " → "Port Harcourt"). Applied on BOTH the write
 * path (trip create) and the read path (search) so stored values and query
 * values share one canonical form. That lets search use plain case-sensitive
 * equality — which the (from, to, departureTime) btree index can serve — instead
 * of `mode:"insensitive"` (ILIKE), which can't use the index and seq-scans the
 * hottest endpoint. The matching SQL is `initcap(regexp_replace(btrim(x),'\s+',' ','g'))`,
 * used by the backfill migration to canonicalize pre-existing rows.
 */
export function normalizeCity(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const createTripSchema = z
  .object({
    from:          z.string().min(2, "Origin city is required").transform(normalizeCity),
    to:            z.string().min(2, "Destination city is required").transform(normalizeCity),
    departureTime: z.string().min(1, "Departure time is required"),
    arrivalTime:   z.string().optional(),
    price:         z.number().int().positive("Price must be a positive integer (naira)"),
    totalSeats:    z.number().int().min(1).max(100, "Max 100 seats per trip"),
    vehicleType:   z.enum(["Bus", "Luxury Bus", "Coaster", "Car", "SUV"]),
    driverId:      z.uuid("driverId must be a valid UUID").optional(),
    parkName:      z.string().trim().max(100).optional(),
    amenities:     z.array(z.string().trim()).max(15).optional().default([]),
  })
  .refine((d) => d.from !== d.to, {
    message: "Origin and destination cannot be the same",
    path: ["to"],
  })
  .refine((d) => !Number.isNaN(Date.parse(d.departureTime)), {
    message: "Departure time must be a valid date/time",
    path: ["departureTime"],
  })
  .refine((d) => {
    const parsed = Date.parse(d.departureTime);
    if (Number.isNaN(parsed)) return true; // already caught above
    return parsed > Date.now();
  }, {
    message: "Departure time must be in the future",
    path: ["departureTime"],
  })
  .refine((d) => d.arrivalTime == null || !Number.isNaN(Date.parse(d.arrivalTime)), {
    message: "Arrival time must be a valid date/time",
    path: ["arrivalTime"],
  })
  .refine(
    (d) =>
      d.arrivalTime == null ||
      Number.isNaN(Date.parse(d.departureTime)) ||
      Date.parse(d.arrivalTime) > Date.parse(d.departureTime),
    {
      message: "Arrival must be after departure",
      path: ["arrivalTime"],
    }
  );

export const searchTripsQuerySchema = z
  .object({
    from:       z.string().min(1, "Origin is required").transform(normalizeCity),
    to:         z.string().min(1, "Destination is required").transform(normalizeCity),
    date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    passengers: z.coerce.number().int().min(1).default(1),
    // --- Optional refinement filters (Booking Search page) ---
    /** Exact stored vehicle type, e.g. "Luxury Bus". */
    vehicleType: z.string().trim().max(40).optional(),
    /** Price band (naira). Trips with price within [minPrice, maxPrice] match. */
    minPrice:    z.coerce.number().int().min(0).optional(),
    maxPrice:    z.coerce.number().int().min(0).optional(),
    /** CSV of amenity labels; a trip must offer ALL selected amenities. */
    amenities:   csvArray,
    /** Restrict to a single transport company. */
    operatorId:  z.uuid().optional(),
    /** Result ordering. departure = soonest first (default). */
    sort:        z.enum(["departure", "price_asc", "price_desc"]).default("departure"),
    ...paginationQuerySchema.shape,
  })
  .refine((d) => d.minPrice == null || d.maxPrice == null || d.minPrice <= d.maxPrice, {
    message: "minPrice cannot exceed maxPrice",
    path: ["maxPrice"],
  });

export const listTripsQuerySchema = z.object({
  operatorId: z.uuid().optional(),
  /** Admin: partial city-name search across `from` and `to` (case-insensitive). */
  search:     z.string().trim().max(100).optional(),
  ...paginationQuerySchema.shape,
});

export const toggleTripSchema     = z.object({ isActive: z.boolean() });
export const markFullSchema       = z.object({ isFull: z.boolean() });
export const setOfflineCountSchema = z.object({
  offlineCount: z.number().int().min(0, "Offline count cannot be negative"),
});

export type CreateTripInput      = z.infer<typeof createTripSchema>;
export type SearchTripsQuery     = z.infer<typeof searchTripsQuerySchema>;
export type SearchTripsInput     = z.input<typeof searchTripsQuerySchema>;
export type ListTripsQuery       = z.infer<typeof listTripsQuerySchema>;
export type ToggleTripInput      = z.infer<typeof toggleTripSchema>;
export type MarkFullInput        = z.infer<typeof markFullSchema>;
export type SetOfflineCountInput = z.infer<typeof setOfflineCountSchema>;
