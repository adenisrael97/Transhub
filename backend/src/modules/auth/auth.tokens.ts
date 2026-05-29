/**
 * JWT signing & verification. The token's claims are exactly the AuthUser shape
 * the frontend decodes ([lib/auth.ts] getUser), so the client can read
 * id/email/fullName/phone/role straight from the token.
 *
 * Only access tokens for now (see Phase 1 notes). Refresh-token rotation can be
 * layered on later without changing this module's callers.
 */
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env";
import type { AuthUser } from "../../shared/types/auth";

// Runtime schema for the JWT payload. Validates shape on every verify() call so
// a malformed or tampered token never reaches req.user with undefined fields.
const tokenPayloadSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  role: z.enum(["passenger", "operator", "admin", "driver"]),
  // Only present for role=operator. Optional so passenger/admin tokens stay valid.
  operatorId: z.uuid().optional(),
});

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(user, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string") {
    throw new Error("Unexpected string token payload");
  }
  // Throws ZodError on shape mismatch; authenticate middleware converts that to 401.
  return tokenPayloadSchema.parse(decoded);
}
