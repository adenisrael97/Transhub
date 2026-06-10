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

/**
 * Liveness — is the process up and the event loop responsive? This MUST NOT
 * touch external dependencies: a flapping Redis/Postgres should never cause the
 * platform to refuse a rollout or kill an otherwise-running process. Point the
 * deploy platform's health-check path here (e.g. Render "Health Check Path").
 */
healthRouter.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: Math.round(process.uptime()) });
});

/**
 * Readiness — are dependencies reachable? Returns 503 when DB or Redis is down.
 * Use this for LB traffic gating / dashboards, NOT as the deploy health gate.
 */
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
