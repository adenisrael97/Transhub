/**
 * Shared constants used across the TransHub frontend.
 * Centralised here to avoid duplication and ensure consistency.
 */
import type { PaymentMethodId } from "@/types";

/** Nigerian cities served by TransHub, used in search forms and selectors. */
export const CITIES = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Kano",
  "Ibadan",
  "Enugu",
  "Benin City",
  "Kaduna",
  "Owerri",
  "Calabar",
  "Warri",
  "Jos",
  "Uyo",
] as const;

export type City = (typeof CITIES)[number];

/**
 * Scheduled-trip vehicle types — the SINGLE source of truth shared by the
 * operator trip-create form and the passenger search filter. These are the exact
 * strings stored on `trips.vehicleType`, so the search filter matches real data
 * (a filter offering values that can't be created would always return nothing).
 */
export const VEHICLE_TYPES = ["Bus", "Luxury Bus", "Coaster", "Car", "SUV"] as const;

/**
 * Bus amenities — shared by the operator trip-create form and the passenger
 * search filter. Stored verbatim in the `trips.amenities` string[] column, so
 * the search filter must use these EXACT labels to match. The first four are the
 * canonical search-filter facets (and align with the seeded short labels "AC"/
 * "WiFi"); the rest are extra options an operator may offer.
 */
export const BUS_AMENITIES = [
  "AC", "WiFi", "Charging Port", "Reclining Seats",
  "Restroom/Toilet", "TV/Entertainment", "Extra Legroom",
  "Water/Snacks", "Luggage Space",
] as const;

/** The amenity facets surfaced as filter chips on the passenger search page. */
export const AMENITY_FILTERS = ["AC", "WiFi", "Charging Port", "Reclining Seats"] as const;

/**
 * Tailwind class maps for booking / ticket / operator / waybill status badges.
 * Uses the design-system hex tokens (matching the rest of the UI), not the
 * generic Tailwind palette.
 */
export const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-[#F0FDF4] text-[#16A34A]",
  pending: "bg-[#FFFBEB] text-[#D97706]",
  completed: "bg-[#F1F5F9] text-[#64748B]",
  cancelled: "bg-[#FEF2F2] text-[#DC2626]",
  upcoming: "bg-[#EFF6FF] text-[#2563EB]",
  active: "bg-[#F0FDF4] text-[#16A34A]",
  scheduled: "bg-[#EFF6FF] text-[#2563EB]",
  // Operator request statuses
  approved: "bg-[#F0FDF4] text-[#16A34A]",
  declined: "bg-[#FEF2F2] text-[#DC2626]",
  // Waybill statuses
  in_transit: "bg-[#FFFBEB] text-[#D97706]",
  delivered: "bg-[#F0FDF4] text-[#16A34A]",
  out_for_delivery: "bg-[#EFF6FF] text-[#2563EB]",
};

/**
 * Charter vehicle catalogue — the single source of truth for the slug the UI
 * sends to the backend (`vehicleType`) and its human-readable label / base rate.
 * Consumed by the charter form (VehicleSelector), the estimate calculator
 * (charterStore) and every place that renders a stored charter's vehicle type.
 */
export const CHARTER_VEHICLES = [
  { id: "suv",       label: "SUV / Car",        seats: "1–4",   rate: 15_000 },
  { id: "pickup",    label: "Pickup Truck",     seats: "1–3",   rate: 20_000 },
  { id: "cargo-van", label: "Cargo Van",        seats: "Cargo", rate: 25_000 },
  { id: "bus-18",    label: "Mini Bus (18)",    seats: "18",    rate: 35_000 },
  { id: "coaster",   label: "Coaster Bus (33)", seats: "33",    rate: 60_000 },
  { id: "bus-33",    label: "Full Bus (33)",    seats: "33",    rate: 80_000 },
] as const;

const VEHICLE_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  CHARTER_VEHICLES.map((v) => [v.id, v.label])
);

/**
 * Human-readable label for a charter vehicle slug (e.g. "coaster" →
 * "Coaster Bus (33)"). Falls back to the raw slug for any unknown value so a
 * future vehicle type still renders something rather than blank.
 */
export function charterVehicleLabel(slug: string | null | undefined): string {
  if (!slug) return "—";
  return VEHICLE_LABEL_BY_ID[slug] ?? slug;
}

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
}

/** Payment methods available at checkout (icons rendered by the page). */
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "card", label: "Debit / Credit Card" },
  { id: "transfer", label: "Bank Transfer" },
  { id: "ussd", label: "USSD (*737#)" },
];
