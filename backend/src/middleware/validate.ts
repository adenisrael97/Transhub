/**
 * Input validation middleware. Runs a Zod schema against req.body or
 * req.query; on failure throws a ValidationError (→ 400 with field details
 * via the error handler). On success, replaces the input with the parsed
 * (and potentially transformed) data.
 *
 * Note: validateQuery does NOT reassign req.query — Express 5 inherits
 * IncomingMessage.query which is a getter-only property. Validation runs
 * for its side-effect (throwing on bad input); controllers cast req.query
 * themselves after this guard passes.
 *
 * validateParams: validates req.params against a Zod schema. The canonical
 * use-case is enforcing UUID format on :id params before they hit the DB —
 * a non-UUID string would otherwise cause a Postgres "invalid input syntax
 * for type uuid" error that surfaces as a raw 500 instead of a clean 400.
 */
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { z } from "zod";
import { ValidationError } from "../shared/errors";

function extractDetails(error: import("zod").ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError("Validation failed", extractDetails(result.error));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new ValidationError("Invalid query parameters", extractDetails(result.error));
    }
    next();
  };
}

export function validateParams(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      throw new ValidationError("Invalid route parameters", extractDetails(result.error));
    }
    next();
  };
}

/** Convenience: validate that req.params contains a valid UUID `id`. */
export const validateId = validateParams(z.object({ id: z.uuid("id must be a valid UUID") }));

/** Convenience: validate that req.params contains a valid UUID `bookingId`. */
export const validateBookingId = validateParams(
  z.object({ bookingId: z.uuid("bookingId must be a valid UUID") })
);
