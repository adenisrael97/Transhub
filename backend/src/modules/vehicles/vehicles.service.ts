/**
 * Vehicles business logic.
 * Ownership check: an operator can only mutate their OWN vehicles.
 */
import { ForbiddenError, NotFoundError, ConflictError } from "../../shared/errors";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import { vehiclesRepository, type VehicleDTO, type VehicleListFilter } from "./vehicles.repository";
import type { CreateVehicleInput, UpdateVehicleInput } from "./vehicles.schema";

// Minimum capacity per vehicle type — a bus is not a bus if it has 3 seats.
const MIN_CAPACITY: Record<string, number> = {
  bus:     20,
  minibus: 10,
  coaster: 30,
  van:      5,
};

function assertCapacity(type: string, capacity: number): void {
  const min = MIN_CAPACITY[type];
  if (min !== undefined && capacity < min) {
    throw new ConflictError(
      `A ${type} must have at least ${min} seats (got ${capacity})`
    );
  }
}

export const vehiclesService = {
  /** Paginated, filtered fleet for the operator dashboard. */
  async getFleet(
    operatorId: string,
    filter: VehicleListFilter,
    pagination: PaginationQuery
  ): Promise<{ vehicles: VehicleDTO[]; pagination: PageMeta }> {
    const { items, total } = await vehiclesRepository.findPaginated(operatorId, filter, pagination);
    return { vehicles: items, pagination: pageMeta(total, pagination) };
  },

  async addVehicle(operatorId: string, data: CreateVehicleInput): Promise<VehicleDTO> {
    assertCapacity(data.type, data.capacity);
    return vehiclesRepository.create(operatorId, data);
  },

  async updateVehicle(
    id: string,
    operatorId: string,
    data: UpdateVehicleInput
  ): Promise<VehicleDTO> {
    const vehicle = await vehiclesRepository.findById(id);
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    if (vehicle.operatorId !== operatorId) throw new ForbiddenError("You do not own this vehicle");

    const newType     = data.type     ?? vehicle.type;
    const newCapacity = data.capacity ?? vehicle.capacity;
    assertCapacity(newType, newCapacity);

    return vehiclesRepository.update(id, data);
  },

  async removeVehicle(id: string, operatorId: string): Promise<void> {
    const vehicle = await vehiclesRepository.findById(id);
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    if (vehicle.operatorId !== operatorId) throw new ForbiddenError("You do not own this vehicle");
    await vehiclesRepository.softDelete(id);
  },
};
