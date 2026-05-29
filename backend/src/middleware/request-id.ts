/**
 * Assigns every request a unique ID (reusing an inbound x-request-id if present)
 * and echoes it back in the response header. The ID is attached to logs so a
 * single request can be traced across the system.
 */
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id");
  req.id = incoming && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
}
