/**
 * Health check — confirms the process is up AND its dependencies are reachable.
 * Returns 200 only when both Postgres and Redis respond; 503 otherwise.
 * Used by load balancers, Docker, and uptime monitors.
 */
import { Router } from "express";
import { prisma } from "../../infra/db/client";
import { redis } from "../../infra/redis/client";

export const healthRouter = Router();

/**
 * Reject if a check doesn't settle within `ms`, so a *hung* dependency reports
 * "down" instead of hanging the health endpoint (which would wedge LB probes).
 */
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("health check timed out")), ms).unref()
    ),
  ]);
}

healthRouter.get("/health", async (_req, res) => {
  const checks = { db: "down", redis: "down" };

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 2000);
    checks.db = "up";
  } catch {
    /* leave as "down" */
  }

  try {
    await withTimeout(redis.ping(), 2000);
    checks.redis = "up";
  } catch {
    /* leave as "down" */
  }

  const ok = checks.db === "up" && checks.redis === "up";
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    ...checks,
    uptime: Math.round(process.uptime()),
  });
});
