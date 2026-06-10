/**
 * Per-request observability: tags the request's Sentry scope (request id, route)
 * and, on response finish, emits performance signals for slow requests and
 * oversized payloads. Cheap — a single hrtime read + a content-length check.
 */
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { tagRequest, reportSlow, reportLargePayload } from "../infra/sentry";

export function observability(req: Request, res: Response, next: NextFunction): void {
  tagRequest(req);
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const route = `${req.method} ${req.path}`;
    if (ms >= env.SLOW_REQUEST_MS) {
      reportSlow("request", Math.round(ms), { target: route, status: res.statusCode });
    }
    const len = Number(res.getHeader("content-length") ?? 0);
    if (len >= env.LARGE_PAYLOAD_BYTES) {
      reportLargePayload(route, len);
    }
  });

  next();
}
