/**
 * Vehicles data access — the ONLY place that touches the `vehicles` table.
 * Table-ownership rule: this module owns `vehicles`.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";
import type { CreateVehicleInput, UpdateVehicleInput } from "./vehicles.schema";

export interface VehicleListFilter {
  type?:   string;
  search?: string;
}

export interface VehicleDTO {
  id:         string;
  operatorId: string;
  plate:      string;
  make:       string;
  model:      string;
  capacity:   number;
  type:       string;
  active:     boolean;
  createdAt:  string;
  updatedAt:  string;
}

function toDTO(v: {
  id: string; operatorId: string; plate: string; make: string;
  model: string; capacity: number; type: string; active: boolean;
  createdAt: Date; updatedAt: Date;
}): VehicleDTO {
  return {
    id:         v.id,
    operatorId: v.operatorId,
    plate:      v.plate,
    make:       v.make,
    model:      v.model,
    capacity:   v.capacity,
    type:       v.type,
    active:     v.active,
    createdAt:  v.createdAt.toISOString(),
    updatedAt:  v.updatedAt.toISOString(),
  };
}

export const vehiclesRepository = {
  async findByOperator(operatorId: string): Promise<VehicleDTO[]> {
    const rows = await prisma.vehicle.findMany({
      where:   { operatorId, active: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDTO);
  },

  /** A page of an operator's active vehicles, filtered + searched, newest first. */
  async findPaginated(
    operatorId: string,
    filter: VehicleListFilter,
    pagination: PaginationQuery
  ): Promise<Page<VehicleDTO>> {
    const and: Prisma.VehicleWhereInput[] = [{ operatorId, active: true }];
    if (filter.type) and.push({ type: filter.type });
    if (filter.search) {
      const s = filter.search;
      and.push({
        OR: [
          { plate: { contains: s, mode: "insensitive" } },
          { make:  { contains: s, mode: "insensitive" } },
          { model: { contains: s, mode: "insensitive" } },
        ],
      });
    }
    const where: Prisma.VehicleWhereInput = { AND: and };
    const [rows, total] = await prisma.$transaction([
      prisma.vehicle.findMany({ where, orderBy: { createdAt: "desc" }, ...toSkipTake(pagination) }),
      prisma.vehicle.count({ where }),
    ]);
    return { items: rows.map(toDTO), total };
  },

  async findById(id: string): Promise<VehicleDTO | null> {
    const row = await prisma.vehicle.findUnique({ where: { id } });
    return row ? toDTO(row) : null;
  },

  async create(operatorId: string, data: CreateVehicleInput): Promise<VehicleDTO> {
    const row = await prisma.vehicle.create({
      data: {
        operatorId,
        plate:    data.plate,
        make:     data.make,
        model:    data.model,
        capacity: data.capacity,
        type:     data.type,
      },
    });
    return toDTO(row);
  },

  async update(id: string, data: UpdateVehicleInput): Promise<VehicleDTO> {
    const row = await prisma.vehicle.update({
      where: { id },
      data:  { ...data },
    });
    return toDTO(row);
  },

  async softDelete(id: string): Promise<void> {
    await prisma.vehicle.update({ where: { id }, data: { active: false } });
  },
};
