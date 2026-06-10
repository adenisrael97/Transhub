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
import swaggerUi from "swagger-ui-express";
import { env, corsOrigins } from "./config/env";
import { logger } from "./infra/logger";
import { requestId } from "./middleware/request-id";
import { observability } from "./middleware/observability";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { apiLimiter, webhookLimiter } from "./middleware/rate-limit";
import { getSpec } from "./openapi";
import { healthRouter } from "./modules/health";
import { authRouter } from "./modules/auth";
import { usersRouter } from "./modules/users";
import { operatorsRouter } from "./modules/operators";
import { driversRouter } from "./modules/drivers";
import { tripsRouter } from "./modules/trips";
import { bookingsRouter } from "./modules/bookings";
import { paymentsRouter, paymentsController } from "./modules/payments";
import { ticketsRouter }   from "./modules/tickets";
import { analyticsRouter } from "./modules/analytics";
import { vehiclesRouter }  from "./modules/vehicles";
import { chartersRouter }  from "./modules/charters";
import { waybillsRouter }  from "./modules/waybills";
import { transactionsRouter } from "./modules/transactions";
import { contactRouter }   from "./modules/contact";

export function createApp(): Express {
  const app = express();

  // Trust the first proxy hop (load balancer / reverse proxy) so req.ip reflects
  // the real client address for rate limiting and logs, not the proxy's. Set to
  // the number of proxies in front of the app — 1 covers the common single-LB
  // deployment (Render/Railway/Fly/Nginx).
  app.set("trust proxy", 1);

  // Helmet: opinionated security header defaults + explicit CSP and HSTS.
  // CSP allows requests only to the frontend origin; keeps XSS fallout contained.
  // HSTS is only set in production (locally we run plain HTTP, so it would break things).
  const isProd = env.NODE_ENV === "production";

  // Build CSP directives conditionally — never pass null/undefined to Helmet
  // directive values; Helmet serializes them literally which produces malformed
  // headers. Omit the key entirely if the directive should not be present.
  const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc:  ["'self'"],
    styleSrc:   ["'self'", "'unsafe-inline'"],
    imgSrc:     ["'self'", "data:"],
    connectSrc: ["'self'", ...corsOrigins, env.FRONTEND_URL],
    fontSrc:    ["'self'"],
    objectSrc:  ["'none'"],
    frameSrc:   ["'none'"],
    // upgrade-insecure-requests breaks local HTTP dev; emit only in production.
    ...(isProd && { upgradeInsecureRequests: [] }),
  };

  app.use(
    helmet({
      contentSecurityPolicy: { directives: cspDirectives },
      hsts: isProd ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
      // COEP: enabled in production; disabled in dev so Swagger UI loads correctly
      // (the UI iframe requires cross-origin embedding to be permitted).
      crossOriginEmbedderPolicy: isProd,
    })
  );
  app.use(cors({
    origin:      corsOrigins,
    credentials: true,
    methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  }));

  // Health FIRST — before body parsing, request logging, and the rate limiter.
  // Orchestrator/LB probes must hit the cheapest, most-available path: if a
  // probe ever consumed rate-limit budget and got a 429, the orchestrator would
  // kill healthy pods (self-inflicted outage). Skipping pino here also keeps
  // high-frequency probes out of the logs.
  app.use(healthRouter);

  // Webhook MUST be registered with express.raw() BEFORE the global express.json()
  // so the raw body Buffer is available for HMAC-SHA512 signature verification.
  // Once express.json() runs, the Buffer is gone.
  app.post(
    "/payments/webhook",
    webhookLimiter,
    express.raw({ type: "application/json" }),
    paymentsController.webhook
  );

  app.use(express.json());
  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => (req as express.Request).id }));
  // Sentry per-request context + slow-request / large-payload signals.
  app.use(observability);
  // Global API limiter. NOTE: this runs before any route's authenticate(), so
  // req.user is not yet set — every request here is keyed by client IP. Per-user
  // keying only takes effect on the stricter per-route limiters that sit after
  // authenticate() (e.g. payment-init). Health is mounted above, so it is exempt.
  app.use(apiLimiter);

  // --- routes ---
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/operators", operatorsRouter);
  app.use("/drivers", driversRouter);
  app.use("/trips", tripsRouter);
  app.use("/bookings", bookingsRouter);
  app.use("/payments", paymentsRouter);
  app.use("/tickets",   ticketsRouter);
  app.use("/analytics", analyticsRouter);
  app.use("/vehicles",  vehiclesRouter);
  app.use("/charters",  chartersRouter);
  app.use("/waybills",  waybillsRouter);
  app.use("/transactions", transactionsRouter);
  app.use("/contact",   contactRouter);

  // Swagger UI — dev/staging only. Never expose in production.
  if (env.NODE_ENV !== "production") {
    const spec = getSpec();
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
    app.get("/docs.json", (_req, res) => res.json(spec));
  }

  // --- fallbacks (must be last) ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
