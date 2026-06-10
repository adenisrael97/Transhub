/**
 * BullMQ queues and workers.
 * BullMQ bundles its own ioredis internally, so we must pass a plain
 * ConnectionOptions object (host/port) rather than an ioredis instance to
 * avoid TypeScript type conflicts between the two ioredis versions.
 */
import { Queue, Worker, type Job, type ConnectionOptions } from "bullmq";
import { env } from "../../config/env";
import { logger } from "../logger";

// Parse the REDIS_URL into a plain connection options object that BullMQ
// understands natively (no version conflicts with the project's own ioredis).
function parseRedisUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);
  const isTls = parsed.protocol === "rediss:";
  return {
    host:                parsed.hostname || "localhost",
    port:                parseInt(parsed.port || (isTls ? "6380" : "6379"), 10),
    password:            parsed.password || undefined,
    db:                  parsed.pathname ? parseInt(parsed.pathname.slice(1) || "0", 10) : 0,
    maxRetriesPerRequest: null,
    enableReadyCheck:    false,
    ...(isTls && { tls: {} }),
  };
}

// Shared BullMQ connection options — reused by every queue and worker so they
// all talk to the same Redis with identical settings.
export const connection = parseRedisUrl(env.REDIS_URL);

// ---------------------------------------------------------------------------
// Queue definitions
// ---------------------------------------------------------------------------
export interface HoldExpiryJob {
  userId:  string;
  tripId:  string;
  seatIds: string[];
}

export const notificationsQueue = new Queue("notifications", {
  connection,
  defaultJobOptions: {
    attempts:         3,
    backoff:          { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 200 },
  },
});

export const holdExpiryQueue = new Queue<HoldExpiryJob, void, "expire">("hold-expiry", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail:     200,
    attempts:         3,
    backoff:          { type: "exponential", delay: 2000 },
  },
});

// How often the safety-net sweeper reclaims orphaned seat holds.
export const SEAT_SWEEP_INTERVAL_MS = 60_000;

// Carries no payload — each run scans the DB for expired holds.
export const seatSweepQueue = new Queue("seat-sweep", {
  connection,
  defaultJobOptions: { removeOnComplete: true, removeOnFail: 50 },
});

// ---------------------------------------------------------------------------
// Worker — started only in the main server process
// ---------------------------------------------------------------------------
let holdExpiryWorker: Worker<HoldExpiryJob, void, "expire"> | null = null;

export function startHoldExpiryWorker(
  processor: (job: Job<HoldExpiryJob, void, "expire">) => Promise<void>
): void {
  if (holdExpiryWorker) return;
  holdExpiryWorker = new Worker<HoldExpiryJob, void, "expire">("hold-expiry", processor, {
    connection,
    concurrency: 10,
  });
  holdExpiryWorker.on("completed", (job) =>
    logger.debug({ jobId: job.id }, "hold-expiry job completed")
  );
  holdExpiryWorker.on("failed", (job, err) =>
    logger.error({ jobId: job?.id, err }, "hold-expiry job failed")
  );
  logger.info("✅ hold-expiry worker started");
}

// ---------------------------------------------------------------------------
// Seat-sweep worker + recurring schedule
// ---------------------------------------------------------------------------
let seatSweepWorker: Worker | null = null;

export function startSeatSweepWorker(processor: () => Promise<void>): void {
  if (seatSweepWorker) return;
  seatSweepWorker = new Worker("seat-sweep", () => processor(), {
    connection,
    concurrency: 1,
  });
  seatSweepWorker.on("failed", (job, err) =>
    logger.error({ jobId: job?.id, err }, "seat-sweep job failed")
  );
  seatSweepWorker.on("error", (err) => logger.error({ err }, "seat-sweep worker error"));
  logger.info("✅ seat-sweep worker started");
}

/**
 * Register the recurring sweep. upsertJobScheduler is idempotent by id, so
 * repeated boots keep exactly one schedule rather than stacking duplicates.
 */
export async function scheduleSeatSweep(): Promise<void> {
  await seatSweepQueue.upsertJobScheduler(
    "seat-sweep",
    { every: SEAT_SWEEP_INTERVAL_MS },
    { name: "sweep" }
  );
}

export async function closeQueue(): Promise<void> {
  await holdExpiryWorker?.close();
  await seatSweepWorker?.close();
  await holdExpiryQueue.close();
  await seatSweepQueue.close();
  await notificationsQueue.close();
}
