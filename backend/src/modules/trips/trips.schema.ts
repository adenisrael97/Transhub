/** Zod schemas for trips. operatorId is NOT in createTripSchema — it comes from req.user (JWT). */
import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";

export const createTripSchema = z
  .object({
    from:          z.string().min(2, "Origin city is required"),
    to:            z.string().min(2, "Destination city is required"),
    departureTime: z.string().min(1, "Departure time is required"),
    arrivalTime:   z.string().optional(),
    price:         z.number().int().positive("Price must be a positive integer (naira)"),
    totalSeats:    z.number().int().min(1).max(100, "Max 100 seats per trip"),
    vehicleType:   z.enum(["Bus", "Luxury Bus", "Coaster", "Car", "SUV"]),
    driverNumber:  z.string().optional(),
  })
  .refine((d) => d.from !== d.to, {
    message: "Origin and destination cannot be the same",
    path: ["to"],
  })
  // Reject unparseable dates here so they never reach `new Date()` in the
  // repository — otherwise an Invalid Date would surface as a Prisma 500
  // instead of a clean 400.
  .refine((d) => !Number.isNaN(Date.parse(d.departureTime)), {
    message: "Departure time must be a valid date/time",
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

export const searchTripsQuerySchema = z.object({
  from:       z.string().min(1, "Origin is required"),
  to:         z.string().min(1, "Destination is required"),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  passengers: z.coerce.number().int().min(1).default(1),
});

export const listTripsQuerySchema = z.object({
  operatorId: z.uuid().optional(),
  ...paginationQuerySchema.shape,
});

export type CreateTripInput  = z.infer<typeof createTripSchema>;
export type SearchTripsQuery = z.infer<typeof searchTripsQuerySchema>;
export type ListTripsQuery   = z.infer<typeof listTripsQuerySchema>;
