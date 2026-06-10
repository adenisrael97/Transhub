/** HTTP layer for vehicles. No business logic — reads req, calls service, sends res. */
import type { Request, Response } from "express";
import { ForbiddenError } from "../../shared/errors";
import { vehiclesService } from "./vehicles.service";
import { listVehiclesQuerySchema, type CreateVehicleInput, type UpdateVehicleInput } from "./vehicles.schema";

type IdParam = { id: string };

export const vehiclesController = {
  async getFleet(req: Request, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) throw new ForbiddenError("Your account is not linked to an operator profile");
    const { page, limit, ...filter } = listVehiclesQuerySchema.parse(req.query);
    const result = await vehiclesService.getFleet(operatorId, filter, { page, limit });
    res.json(result);
  },

  async addVehicle(req: Request, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) throw new ForbiddenError("Your account is not linked to an operator profile");
    const vehicle = await vehiclesService.addVehicle(operatorId, req.body as CreateVehicleInput);
    res.status(201).json({ vehicle });
  },

  async updateVehicle(req: Request<IdParam>, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) throw new ForbiddenError("Your account is not linked to an operator profile");
    const vehicle = await vehiclesService.updateVehicle(req.params.id, operatorId, req.body as UpdateVehicleInput);
    res.json({ vehicle });
  },

  async removeVehicle(req: Request<IdParam>, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) throw new ForbiddenError("Your account is not linked to an operator profile");
    await vehiclesService.removeVehicle(req.params.id, operatorId);
    res.status(204).send();
  },
};
