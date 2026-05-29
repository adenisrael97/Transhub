/**
 * Central error handling. Every error in the app funnels through here, producing
 * a consistent JSON shape: { error: { code, message, details? } }.
 *
 * - Known AppErrors → their status code + code.
 * - Anything else → logged with the request id and returned as a generic 500
 *   (we never leak internal error details to the client).
 */
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../shared/errors";
import { logger } from "../infra/logger";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` },
  });
}

// Must keep all four args — Express identifies error handlers by arity.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = { code: err.code, message: err.message };
    if (err.details !== undefined) body.details = err.details;
    res.status(err.statusCode).json({ error: body });
    return;
  }

  // Prisma unique-constraint violation (P2002) — can occur in concurrent register
  // requests that both pass the pre-check but only one wins the DB insert.
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    res.status(409).json({ error: { code: "CONFLICT", message: "Resource already exists" } });
    return;
  }

  logger.error({ err, reqId: req.id }, "Unhandled error");
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}
