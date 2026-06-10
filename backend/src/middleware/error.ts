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
import { captureError } from "../infra/sentry";

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

    // Sentry: expected 4xx are noise EXCEPT the security-relevant ones —
    //  401 (authentication) and 403 (authorization) are captured as warnings so
    //  spikes (credential stuffing, BOLA probing) are visible. 5xx AppErrors are
    //  real server faults → captured as errors. Other 4xx (validation, conflict,
    //  not-found, rate-limit) are deliberately not sent.
    if (err.statusCode === 401) {
      captureError(err, { req, category: "auth", level: "warning" });
    } else if (err.statusCode === 403) {
      captureError(err, { req, category: "authorization", level: "warning" });
    } else if (err.statusCode >= 500) {
      captureError(err, { req, category: "internal" });
    }
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

  // Prisma FK violation (P2003) — e.g. deleting a trip that still has confirmed
  // bookings referencing it. Surface as 409 so the caller gets a clear reason
  // instead of a generic 500.
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2003"
  ) {
    res.status(409).json({
      error: {
        code: "CONFLICT",
        message: "Cannot delete this resource because it is referenced by existing records (e.g. confirmed bookings).",
      },
    });
    return;
  }

  // Body-parser failures (malformed JSON, oversized payload, bad charset) are
  // CLIENT errors. express.json() throws an http-errors-style error carrying a
  // 4xx `status` and a `type` like "entity.parse.failed" / "entity.too.large".
  // Without this branch they fall through to the generic 500 below — masking a
  // bad request as a server fault and polluting error-rate/alerting metrics.
  if (
    typeof err === "object" &&
    err !== null &&
    typeof (err as { type?: unknown }).type === "string" &&
    (err as { type: string }).type.startsWith("entity.") &&
    typeof (err as { status?: unknown }).status === "number"
  ) {
    const status = (err as { status: number }).status;
    const tooLarge = status === 413;
    res.status(status).json({
      error: {
        code: tooLarge ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
        message: tooLarge ? "Request body is too large" : "Malformed request body",
      },
    });
    return;
  }

  logger.error({ err, reqId: req.id }, "Unhandled error");
  // Unexpected 500 — always capture. Tag Prisma faults as database errors so the
  // "Database Errors" view/alert can isolate them from generic API exceptions.
  const isPrisma =
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError;
  captureError(err, { req, category: isPrisma ? "database" : "api" });
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}
