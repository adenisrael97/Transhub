import api from "@/lib/api";
import type { Trip, TripSearchParams } from "@/types";

// ---- Response envelopes (match backend contract) ----
export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}
export interface TripsEnvelope { trips: Trip[]; pagination?: PaginationMeta; total?: number }
export interface TripEnvelope  { trip: Trip }

// ---- Operator create payload — no operatorId (backend reads it from JWT) ----
export interface CreateTripPayload {
  from:          string;
  to:            string;
  departureTime: string;
  arrivalTime?:  string;
  price:         number;
  totalSeats:    number;
  vehicleType:   string;
  /** UUID of a Driver record belonging to this operator. */
  driverId?:     string;
  parkName?:     string;
  amenities?:    string[];
}

export interface PassengerInfoDTO {
  id:             string;
  fullName:       string;
  phone:          string;
  email:          string | null;
  nextOfKinName:  string;
  nextOfKinPhone: string;
  specialNeeds:   string | null;
}

export interface TripPassengerDTO {
  bookingId:  string;
  seatCount:  number;
  status:     string;
  passengers: PassengerInfoDTO[];
}

/** Refinement filters for the passenger search page (all optional). */
export interface TripSearchFilters {
  vehicleType?: string;
  minPrice?:    number;
  maxPrice?:    number;
  amenities?:   string[];
  operatorId?:  string;
  sort?:        "departure" | "price_asc" | "price_desc";
  page?:        number;
  limit?:       number;
}

/**
 * Passenger: search available trips by route + date with optional refinement
 * filters (vehicle type, price band, amenities, operator) and sort/pagination.
 * `amenities` is sent as a CSV — the backend's csvArray parser accepts it.
 */
export function searchTrips(
  params: TripSearchParams & TripSearchFilters
): Promise<TripsEnvelope> {
  const { amenities, ...rest } = params;
  const query: Record<string, unknown> = { ...rest };
  if (amenities && amenities.length) query.amenities = amenities.join(",");
  return api.get<TripsEnvelope, TripsEnvelope>("/trips/search", { params: query });
}

/** Passenger / any: fetch a single trip with its full seat map. */
export function fetchTrip(id: string): Promise<TripEnvelope> {
  return api.get<TripEnvelope, TripEnvelope>(`/trips/${id}`);
}

/**
 * Admin / Operator: list trips with server-side pagination and optional search.
 * Backend filters by operatorId from the JWT for operators; admins see all.
 */
export function fetchTrips(params?: {
  page?:   number;
  limit?:  number;
  search?: string;
}): Promise<TripsEnvelope> {
  return api.get<TripsEnvelope, TripsEnvelope>("/trips", { params });
}

/** Driver: fetch trips assigned to this driver (matched by phone → driverNumber on backend). */
export function fetchDriverTrips(): Promise<TripsEnvelope> {
  return api.get<TripsEnvelope, TripsEnvelope>("/trips/mine");
}

/** Operator: create a trip (seats are auto-generated on the backend). */
export function createTrip(payload: CreateTripPayload): Promise<TripEnvelope> {
  return api.post<TripEnvelope, TripEnvelope>("/trips", payload);
}

/** Operator: delete a trip and all its seats. */
export function deleteTrip(id: string): Promise<void> {
  return api.delete<void, void>(`/trips/${id}`);
}

/** Operator: toggle a trip online (isActive=true) or offline (isActive=false). */
export function toggleTripActive(id: string, isActive: boolean): Promise<TripEnvelope> {
  return api.patch<TripEnvelope, TripEnvelope>(`/trips/${id}/active`, { isActive });
}

/** Operator/Admin: manually mark a trip full or reopen it for booking. */
export function markTripFull(id: string, isFull: boolean): Promise<TripEnvelope> {
  return api.patch<TripEnvelope, TripEnvelope>(`/trips/${id}/fill`, { isFull });
}

/** Operator/Admin: record the total number of offline (walk-in) bookings for a trip. */
export function setTripOfflineCount(id: string, offlineCount: number): Promise<TripEnvelope> {
  return api.patch<TripEnvelope, TripEnvelope>(`/trips/${id}/offline`, { offlineCount });
}

/** Operator/Driver/Admin: get the passenger list for a specific trip. */
export function fetchTripPassengers(id: string): Promise<{ passengers: TripPassengerDTO[] }> {
  return api.get<{ passengers: TripPassengerDTO[] }, { passengers: TripPassengerDTO[] }>(
    `/trips/${id}/passengers`
  );
}

/**
 * Operator: active drivers for the trip-assignment dropdown. Requests the max
 * page size and active-only so the dropdown isn't truncated by the list
 * endpoint's default pagination.
 */
export function fetchOperatorDrivers(): Promise<{ drivers: import("@/types").DriverDTO[] }> {
  return api.get("/drivers", { params: { limit: 100, isActive: true } });
}

/**
 * Drivers list — server-side paginated/filtered/searchable. Operator sees their
 * own fleet (incl. deactivated); admin sees all (optional ?operatorId).
 * Params: page, limit, isActive, search, operatorId.
 */
export function fetchDrivers(params?: {
  page?: number; limit?: number; isActive?: boolean; search?: string; operatorId?: string;
}): Promise<{ drivers: import("@/types").DriverDTO[]; pagination?: import("@/types").PageMeta }> {
  return api.get("/drivers", { params });
}

/** Operator: create a new driver. */
export function createDriver(payload: {
  fullName:  string;
  phone:     string;
  password:  string;
  licenseNo?: string;
}): Promise<{ driver: import("@/types").DriverDTO }> {
  return api.post("/drivers", payload);
}
