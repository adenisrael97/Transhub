/**
 * JWT signing & verification. Lives in shared/ because more than one module now
 * needs it: `auth` mints tokens on login/register, and `users` re-mints a token
 * when a profile change (name/email/phone) makes the claims embedded in the old
 * token stale. The `authenticate` middleware and the socket server verify here
 * too. Keeping it in shared/ (rule #5 — graduate once a 2nd module needs it)
 * removes the cross-module "leaf import" exceptions those callers used to need.
 *
 * The token's claims are exactly the AuthUser shape the frontend decodes
 * ([lib/auth.ts] getUser), so the client can read id/email/fullName/phone/role
 * straight from the token.
 */
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import type { AuthUser } from "./types/auth";

// Runtime schema for the JWT payload. Validates shape on every verify() call so
// a malformed or tampered token never reaches req.user with undefined fields.
const tokenPayloadSchema = z.object({
  id: z.uuid(),
  // Optional: drivers authenticate by phone only, no email in their token.
  email: z.email().optional(),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  role: z.enum(["passenger", "operator", "admin", "driver"]),
  // Present for role=operator (links to Operator record) and role=driver (scopes queries).
  operatorId: z.uuid().optional(),
});

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(user, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AuthUser {
  // Pin the algorithm: without an explicit allow-list jsonwebtoken accepts any
  // algorithm in the token header. Restricting to HS256 closes algorithm-
  // confusion / downgrade attacks and rejects "alg: none" tokens outright.
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  if (typeof decoded === "string") {
    throw new Error("Unexpected string token payload");
  }
  // Throws ZodError on shape mismatch; authenticate middleware converts that to 401.
  return tokenPayloadSchema.parse(decoded);
}
