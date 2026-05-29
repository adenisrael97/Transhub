/**
 * HTTP layer for auth. Translates requests/responses only — no business logic.
 * (Express 5 forwards async errors to the central error handler automatically,
 * so no try/catch wrappers are needed here.)
 */
import type { Request, Response } from "express";
import { UnauthorizedError } from "../../shared/errors";
import { authService } from "./auth.service";

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const user = await authService.me(req.user.id);
    res.json({ user });
  },
};
