/**
 * Role-based access control. Use AFTER `authenticate`:
 *   router.get("/operators", authenticate, requireRole("admin"), handler)
 * Throws 403 if the authenticated user's role isn't allowed.
 *
 * This is the SERVER-side enforcement — the frontend's AuthGuard is only UX.
 */
import type { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../shared/errors";
import type { Role } from "../shared/types/auth";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires role: ${roles.join(" or ")}`);
    }
    next();
  };
}
