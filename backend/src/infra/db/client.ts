/**
 * PostgreSQL access via Prisma. One shared client for the whole app.
 * connectDb() is called once at boot; disconnectDb() on graceful shutdown.
 */
import { PrismaClient } from "@prisma/client";
import { logger } from "../logger";

export const prisma = new PrismaClient();

export async function connectDb(): Promise<void> {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`; // prove the connection actually works
  logger.info("✅ Postgres connected");
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
  logger.info("Postgres disconnected");
}
