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

  async driverLogin(req: Request, res: Response): Promise<void> {
    const result = await authService.driverLogin(req.body);
    res.status(200).json(result);
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    // Pass role so the service can route to the correct table (drivers vs users).
    const user = await authService.me(req.user.id, req.user.role);
    res.json({ user });
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.requestPasswordReset(req.body.email);
    // Constant response regardless of whether the email exists — no enumeration.
    res.status(200).json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json({
      message: "Your password has been reset. You can now log in with your new password.",
    });
  },
};
