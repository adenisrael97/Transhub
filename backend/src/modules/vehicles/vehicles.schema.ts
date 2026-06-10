import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination";
import { searchSchema } from "../../shared/list-query";

/**
 * Operator fleet list query.
 *  - type:   vehicle type filter (bus | minibus | coaster | van)
 *  - search: plate / make / model
 */
export const listVehiclesQuerySchema = z.object({
  type:   z.enum(["bus", "minibus", "coaster", "van"]).optional(),
  ...searchSchema.shape,
  ...paginationQuerySchema.shape,
});

export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;

export const createVehicleSchema = z.object({
  plate:    z.string().min(1).max(20).trim().toUpperCase(),
  make:     z.string().min(1).max(60).trim(),
  model:    z.string().min(1).max(60).trim(),
  capacity: z.number().int().min(1).max(100),
  type:     z.enum(["bus", "minibus", "coaster", "van"]),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
