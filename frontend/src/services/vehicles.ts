import api from "@/lib/api";
import type { PageMeta, ListParams } from "@/types";

export interface Vehicle {
  id:         string;
  operatorId: string;
  plate:      string;
  make:       string;
  model:      string;
  capacity:   number;
  type:       "bus" | "minibus" | "coaster" | "van";
  active:     boolean;
  createdAt:  string;
  updatedAt:  string;
}

export interface CreateVehiclePayload {
  plate:    string;
  make:     string;
  model:    string;
  capacity: number;
  type:     "bus" | "minibus" | "coaster" | "van";
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

export interface FleetEnvelope { vehicles: Vehicle[]; pagination?: PageMeta }

/** Operator fleet — server-side paginated/filtered/searchable. Params: page, limit, type, search. */
export function getFleet(params?: ListParams): Promise<FleetEnvelope> {
  return api.get<FleetEnvelope, FleetEnvelope>("/vehicles", { params });
}

export function addVehicle(data: CreateVehiclePayload): Promise<{ vehicle: Vehicle }> {
  return api.post<{ vehicle: Vehicle }, { vehicle: Vehicle }>("/vehicles", data);
}

export function updateVehicle(id: string, data: UpdateVehiclePayload): Promise<{ vehicle: Vehicle }> {
  return api.patch<{ vehicle: Vehicle }, { vehicle: Vehicle }>(`/vehicles/${id}`, data);
}

export function removeVehicle(id: string): Promise<void> {
  return api.delete<void, void>(`/vehicles/${id}`);
}
