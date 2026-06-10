/**
 * HTTP layer for driver management. Reads req, calls service, sends res.
 * All routes are operator-only; operatorId is always sourced from the JWT.
 */
import type { Request, Response } from "express";
import { ForbiddenError } from "../../shared/errors";
import { driversService } from "./drivers.service";
import { listDriversQuerySchema, type CreateDriverInput, type UpdateDriverInput } from "./drivers.schema";

type IdParam = { id: string };

export const driversController = {
  async create(req: Request, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) throw new ForbiddenError("No operator profile linked to this account");
    const driver = await driversService.create(req.body as CreateDriverInput, operatorId);
    res.status(201).json({ driver });
  },

  /** GET /drivers — operator (own fleet) or admin (all, optional ?operatorId). Paginated. */
  async list(req: Request, res: Response): Promise<void> {
    const { role, operatorId } = req.user!;
    if (role === "operator" && !operatorId) {
      throw new ForbiddenError("No operator profile linked to this account");
    }
    const { page, limit, ...filter } = listDriversQuerySchema.parse(req.query);
    const result = await driversService.list(filter, role, operatorId, { page, limit });
    res.json(result);
  },

  async getById(req: Request<IdParam>, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) throw new ForbiddenError("No operator profile linked to this account");
    const driver = await driversService.getById(req.params.id, operatorId);
    res.json({ driver });
  },

  async update(req: Request<IdParam>, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) throw new ForbiddenError("No operator profile linked to this account");
    const driver = await driversService.update(req.params.id, operatorId, req.body as UpdateDriverInput);
    res.json({ driver });
  },

  async deactivate(req: Request<IdParam>, res: Response): Promise<void> {
    const operatorId = req.user?.operatorId;
    if (!operatorId) throw new ForbiddenError("No operator profile linked to this account");
    await driversService.deactivate(req.params.id, operatorId);
    res.status(204).send();
  },
};
