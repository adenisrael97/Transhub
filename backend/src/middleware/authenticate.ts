/**
 * Authentication middleware. Verifies the Bearer JWT and attaches the identity
 * to req.user. Throws 401 if the header is missing/malformed or the token is
 * invalid/expired.
 *
 * Imports the token verifier directly from the auth module's token util (a leaf
 * with no module dependencies) to avoid an index ↔ routes import cycle.
 */
import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../shared/errors";
// Intentional exception to the public-interface rule: importing the auth module's
// index here would create an index → routes → middleware → index cycle. auth.tokens
// is a dependency-free leaf, so we import it directly. See the file header.
// eslint-disable-next-line boundaries/dependencies
import { verifyAccessToken } from "../modules/auth/auth.tokens";

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

  next();
}
