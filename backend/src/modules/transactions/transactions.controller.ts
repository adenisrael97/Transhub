import type { Request, Response } from "express";
import { ForbiddenError } from "../../shared/errors";
import { transactionsService } from "./transactions.service";
import { listTransactionsQuerySchema } from "./transactions.schema";

export const transactionsController = {
  /**
   * GET /transactions — role-scoped feed:
   *  admin → all, operator → own (trips' bookings + assigned waybills),
   *  passenger → own payment history.
   */
  async list(req: Request, res: Response): Promise<void> {
    const { id, role, operatorId } = req.user!;
    if (role === "operator" && !operatorId) {
      throw new ForbiddenError("No operator profile linked to this account");
    }
    // Re-parse: validateQuery can't write back to Express 5's getter-only req.query.
    const { page, limit, ...filter } = listTransactionsQuerySchema.parse(req.query);
    const result = await transactionsService.list(filter, { id, role, operatorId }, { page, limit });
    res.json(result);
  },
};
