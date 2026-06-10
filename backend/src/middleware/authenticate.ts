/**
 * Authentication middleware. Verifies the Bearer JWT and attaches the identity
 * to req.user. Throws 401 if the header is missing/malformed or the token is
 * invalid/expired.
 */
import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../shared/errors";
import { verifyAccessToken } from "../shared/tokens";
import { setSentryUser } from "../infra/sentry";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    req.user = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  // Attach { id, role } (never PII) to this request's Sentry isolation scope so
  // any error captured downstream is tied to the acting user.
  setSentryUser({ id: req.user.id, role: req.user.role });

  next();
}
