/**
 * Shared domain models for the TransHub frontend.
 * These mirror the API contract and are the single source of truth
 * for the shape of data flowing through stores, services, and hooks.
 */

export type Role = "passenger" | "operator" | "admin" | "driver";

export interface User {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: Role;
  /** Present only when role === "operator". Links to the Operator record. */
  operatorId?: string;
  /** JWT expiry (seconds since epoch) when derived from a decoded token. */
  exp?: number;
  iat?: number;
}

export type VehicleType = "Bus" | "Luxury Bus" | "Coaster" | "Car" | "SUV";

export interface Seat {
  id: string;
  label: string;
  isBooked: boolean;
}

export interface Trip {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime?: string | null;
  operator: string;
  operatorId?: string;
  price: number;
  availableSeats?: number;
  totalSeats?: number;
  vehicleType?: VehicleType | string;
  driverId?: string | null;
  status?: string;
  isActive?: boolean;
  isFull?: boolean;
  offlineCount?: number;
  createdAt?: string;
  seats?: Seat[];
}

export interface TripSearchParams {
  from: string;
  to: string;
  date: string;
  passengers: string;
}

export interface Passenger {
  name: string;
  phone: string;
  email: string;
}

export type PaymentMethodId = "card" | "transfer" | "ussd";

export interface BookingPayload {
  tripId?: string;
  seats: Seat[];
  passengers: Passenger[];
  paymentMethod: PaymentMethodId;
}

export type BookingStatus =
  | "confirmed"
  | "pending"
  | "completed"
  | "cancelled"
  | "upcoming"
  | "active"
  | "scheduled"
  | "refunded";

export interface HoldResult {
  holdId:     string;
  expiresAt:  string; // ISO-8601 (server clock) — informational only
  ttlSeconds: number; // relative hold lifetime; count down from this to avoid clock skew
  tripId:     string;
  quantity:   number;
}

export interface BookedSeatDTO {
  id:    string;
  label: string;
}

export interface Booking {
  id:          string;
  userId:      string;
  tripId:      string;
  status:      BookingStatus;
  totalAmount: number;
  paymentRef:  string | null;
  seats:       BookedSeatDTO[];
  createdAt:   string;
}

/** Mirrors backend DriverDTO (password omitted). */
export interface DriverDTO {
  id:         string;
  operatorId: string;
  fullName:   string;
  phone:      string;
  licenseNo:  string | null;
  isActive:   boolean;
  createdAt:  string;
  updatedAt:  string;
}

export type OperatorStatus = "pending" | "approved" | "declined";

export interface Operator {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  fleetSize: string;
  vehicleTypes: string[];
  routes: string;
  yearsInOperation: string;
  cacNumber: string;
  additionalInfo?: string;
  status: OperatorStatus;
  appliedAt: string;
  reviewedAt: string | null;
}

export type CharterDuration = "one-way" | "round-trip";

export interface CharterPayload {
  vehicleType: string;
  pickupLocation: string;
  destination: string;
  date: string;
  returnDate: string;
  duration: CharterDuration;
  passengers: number;
  purpose: string;
  estimatedCost: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

export interface WaybillPayload {
  fromLocation:  string;
  toLocation:    string;
  senderName:    string;
  senderPhone:   string;
  recipientName:  string;
  recipientPhone: string;
  description:   string;
  weightKg?:     number;
  declaredValue?: number;
  tripId?:       string;
}

export type WaybillStatus =
  | "pending"
  | "paid"
  | "in_transit"
  | "arrived"
  | "delivered"
  | "returned";

export interface WaybillEvent {
  id:        string;
  status:    string;
  location:  string | null;
  note:      string | null;
  createdAt: string;
}

export interface Waybill {
  id:            string;
  waybillNo:     string;
  status:        WaybillStatus;
  fromLocation:  string;
  toLocation:    string;
  senderName:    string;
  senderPhone:   string;
  recipientName:  string;
  recipientPhone: string;
  description:   string;
  weightKg?:     string | null;
  declaredValue?: string | null;
  fee:           string;
  paidAt?:       string | null;
  createdAt:     string;
  events:        WaybillEvent[];
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}
