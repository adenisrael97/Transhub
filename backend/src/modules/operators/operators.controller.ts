/**
 * HTTP layer for operators. Reads req, calls the service, sends res.
 * No business logic lives here — Express 5 forwards async errors automatically.
 */
import type { Request, Response } from "express";
import { operatorsService } from "./operators.service";
import { listOperatorsQuerySchema } from "./operators.schema";
import type { RegisterOperatorInput } from "./operators.schema";

// Typed request with route params so TypeScript knows :id is a plain string.
type IdParam = { id: string };

export const operatorsController = {
  async register(req: Request, res: Response): Promise<void> {
    const operator = await operatorsService.register(req.body as RegisterOperatorInput);
    res.status(201).json({ operator });
  },

  async list(req: Request, res: Response): Promise<void> {
    // Re-parse: validateQuery guards but can't write back to the getter-only
    // Express 5 req.query, so coercion/defaults aren't applied there.
    const { status, page, limit } = listOperatorsQuerySchema.parse(req.query);
    const result = await operatorsService.list({ status }, { page, limit });
    res.json(result);
  },

  async approve(req: Request<IdParam>, res: Response): Promise<void> {
    const result = await operatorsService.approve(req.params.id);
    res.json(result);
  },

  async decline(req: Request<IdParam>, res: Response): Promise<void> {
    const operator = await operatorsService.decline(req.params.id);
    res.json({ operator });
  },
};
