/**
 * Structured logger (pino). JSON in production; pretty-printed in development.
 * Every module imports this instead of using console.log.
 */
import pino from "pino";
import { env } from "../../config/env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  // pino-http's default request serializer logs ALL headers — without this the
  // bearer JWT (and any cookie) would be written to logs on every authenticated
  // request. Redact them at the base logger so it covers pino-http too.
  redact: ["req.headers.authorization", "req.headers.cookie"],
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
