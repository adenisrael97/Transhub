/**
 * Builds the Express application: security headers, CORS, body parsing,
 * request-id tagging, HTTP logging, routes, and error handling.
 *
 * This file defines WHAT the app is. Starting it (and connecting to infra)
 * is server.ts's job — splitting them lets tests import the app without
 * opening a port or a real DB connection.
 *
 * Future modules mount their routers here, e.g.:
 *   app.use("/auth", authRouter);
 *   app.use("/trips", tripsRouter);
 */
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./infra/logger";
import { requestId } from "./middleware/request-id";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { healthRouter } from "./modules/health/health.routes";
import { authRouter } from "./modules/auth";
import { operatorsRouter } from "./modules/operators";
import { tripsRouter } from "./modules/trips";
import { bookingsRouter } from "./modules/bookings";
import { paymentsRouter, paymentsController } from "./modules/payments";
import { ticketsRouter }   from "./modules/tickets";
import { analyticsRouter } from "./modules/analytics";

export function createApp(): Express {
  const app = express();

  // Trust the first proxy hop (load balancer / reverse proxy) so req.ip reflects
  // the real client address for rate limiting and logs, not the proxy's. Set to
  // the number of proxies in front of the app — 1 covers the common single-LB
  // deployment (Render/Railway/Fly/Nginx).
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

  // Webhook MUST be registered with express.raw() BEFORE the global express.json()
  // so the raw body Buffer is available for HMAC-SHA512 signature verification.
  // Once express.json() runs, the Buffer is gone.
  app.post(
    "/payments/webhook",
    express.raw({ type: "application/json" }),
    paymentsController.webhook
  );

  app.use(express.json());
  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => (req as express.Request).id }));

  // --- routes ---
  app.use(healthRouter);
  app.use("/auth", authRouter);
  app.use("/operators", operatorsRouter);
  app.use("/trips", tripsRouter);
  app.use("/bookings", bookingsRouter);
  app.use("/payments", paymentsRouter);
  app.use("/tickets",   ticketsRouter);
  app.use("/analytics", analyticsRouter);

  // --- fallbacks (must be last) ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
