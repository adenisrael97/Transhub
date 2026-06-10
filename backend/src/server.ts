/**
 * Application entry point. Boot order:
 *   1. validate env (happens on import of ./config/env)
 *   2. connect to Postgres and Redis
 *   3. start the HTTP server
 *   4. handle graceful shutdown (drain connections on SIGINT/SIGTERM)
 *
 * If any dependency fails to connect, we exit non-zero so the orchestrator
 * (Docker/PM2) can restart us, rather than serving traffic in a broken state.
 */
// MUST be first: initializes Sentry before any instrumented module (http,
// express, redis) is imported. No-op when SENTRY_DSN is unset.
import "./infra/sentry/instrument";
import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./infra/logger";
import { connectDb, disconnectDb } from "./infra/db/client";
import { connectRedis, disconnectRedis } from "./infra/redis/client";
import { initSocketServer, disconnectAllSockets } from "./infra/socket";
import {
  startHoldExpiryWorker,
  startSeatSweepWorker,
  scheduleSeatSweep,
  closeQueue,
} from "./infra/queue/client";
import { processHoldExpiry, processSeatSweep } from "./modules/bookings";
import { notificationsWorker } from "./modules/notifications"; // registers eventBus listeners + starts worker
import { flushSentry } from "./infra/sentry";

async function main(): Promise<void> {
  await connectDb();
  await connectRedis();
  startHoldExpiryWorker(processHoldExpiry);
  startSeatSweepWorker(processSeatSweep);
  await scheduleSeatSweep();

  const app = createApp();
  const server = createServer(app);
  initSocketServer(server);

  server.listen(env.PORT, () => {
    logger.info(`🚀 Server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return; // ignore repeated signals (e.g. double Ctrl-C)
    shuttingDown = true;
    logger.info(`${signal} received — shutting down gracefully...`);
    // Drop live websocket clients first; otherwise their long-lived connections
    // keep server.close()'s callback from ever firing and we'd always hit the
    // hard-timeout exit below.
    disconnectAllSockets();
    server.close(() => {
      void Promise.allSettled([
        flushSentry(),          // drain buffered Sentry events before exit
        disconnectDb(),
        disconnectRedis(),
        closeQueue(),
        notificationsWorker.close(),
      ]).then(() => {
        process.exit(0);
      });
    });
    // Force-exit if graceful shutdown stalls.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Last-resort safety nets so the process never runs in an unknown state.
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception — exiting");
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
