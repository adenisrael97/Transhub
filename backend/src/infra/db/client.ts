/**
 * PostgreSQL access via Prisma. One shared client for the whole app.
 * connectDb() is called once at boot; disconnectDb() on graceful shutdown.
 */
import { PrismaClient } from "@prisma/client";
import { logger } from "../logger";
import { env } from "../../config/env";
import { reportSlow } from "../sentry";

// Emit query events so we can surface slow queries as a performance signal.
export const prisma = new PrismaClient({
  log: [{ emit: "event", level: "query" }],
});

// Slow-query monitoring. We send ONLY the query template (which carries `$1`,
// `$2` placeholders, never the bound values) + its duration — never `e.params`,
// which can contain user data. Grouped per query pattern in Sentry.
prisma.$on("query", (e) => {
  if (e.duration >= env.SLOW_QUERY_MS) {
    reportSlow("query", e.duration, { target: e.query.slice(0, 300) });
  }
});

export async function connectDb(): Promise<void> {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`; // prove the connection actually works
  logger.info("✅ Postgres connected");
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
  logger.info("Postgres disconnected");
}
