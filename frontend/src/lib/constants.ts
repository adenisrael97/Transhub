/**
 * Shared constants used across the TransHub frontend.
 * Centralised here to avoid duplication and ensure consistency.
 */
import type { PaymentMethodId } from "@/types";

/**
 * Route prefixes that render inside a dashboard shell (Admin/Operator/Driver)
 * and must NOT show the public marketing Navbar/Footer. Single source of truth
 * for both components — when adding a new top-level dashboard route, add it
 * here or it will render with double chrome (public navbar over the shell).
 * NOTE: matching is prefix-based — '/charters' (admin) must not be shortened
 * to '/charter', which would also hide chrome on the public charter pages.
 */
export const CHROME_HIDDEN_PREFIXES = [
  "/admin",
  "/operator",
  "/driver",
  "/manage-trips",
  "/bookings",
  "/charters",
  "/waybills",
  "/transactions",
  "/customers",
  "/operators",
  "/analytics",
] as const;

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
// Text colours are deliberately the 700-shade of each hue so small badge text
// clears WCAG-AA (4.5:1) against its own light tint — the 600-shades used
// previously sat around 3:1 (e.g. #16A34A on #F0FDF4 = 3.15).
export const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-[#F0FDF4] text-[#15803D]",
  pending: "bg-[#FFFBEB] text-[#B45309]",
  completed: "bg-[#F1F5F9] text-[#475569]",
  cancelled: "bg-[#FEF2F2] text-[#B91C1C]",
  upcoming: "bg-[#EFF6FF] text-[#1D4ED8]",
  active: "bg-[#F0FDF4] text-[#15803D]",
  scheduled: "bg-[#EFF6FF] text-[#1D4ED8]",
  // Operator request statuses
  approved: "bg-[#F0FDF4] text-[#15803D]",
  declined: "bg-[#FEF2F2] text-[#B91C1C]",
  // Waybill statuses
  in_transit: "bg-[#FFFBEB] text-[#B45309]",
  delivered: "bg-[#F0FDF4] text-[#15803D]",
  out_for_delivery: "bg-[#EFF6FF] text-[#1D4ED8]",
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
