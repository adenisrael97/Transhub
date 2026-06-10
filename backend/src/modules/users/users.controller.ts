/**
 * HTTP layer for user self-service. Reads req, calls the service, sends res.
 * No business logic lives here.
 */
import type { Request, Response } from "express";
import { usersService } from "./users.service";
import { listUsersQuerySchema, type UpdateProfileInput, type ChangePasswordInput } from "./users.schema";

export const usersController = {
  /** GET /users — admin directory. Paginated, role-filterable, searchable. */
  async list(req: Request, res: Response): Promise<void> {
    // Re-parse: validateQuery can't write back to Express 5's getter-only req.query.
    const { page, limit, ...filter } = listUsersQuerySchema.parse(req.query);
    const result = await usersService.list(filter, { page, limit });
    res.json(result);
  },

  async getMe(req: Request, res: Response): Promise<void> {
    const user = await usersService.getProfile(req.user!.id);
    res.json({ user });
  },

  async updateMe(req: Request, res: Response): Promise<void> {
    // Returns { user, token } — the refreshed token carries the updated claims.
    const result = await usersService.updateProfile(
      req.user!.id,
      req.body as UpdateProfileInput
    );
    res.json(result);
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;
    await usersService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: "Password changed successfully" });
  },
};
