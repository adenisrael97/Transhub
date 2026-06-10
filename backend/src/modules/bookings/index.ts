// Public interface — other modules import only from here, never from internals.
export { bookingsRouter }  from "./bookings.routes";
export { bookingsService } from "./bookings.service";
// HoldResult now lives in inventory (seat-ownership); re-exported for callers
// that previously imported it from bookings.
export type { HoldResult } from "../inventory";
export type { BookingDTO } from "./bookings.repository";
// Background-job processors are part of the module's public surface — the
// composition root (server.ts) registers them with the queue workers.
export { processHoldExpiry, processSeatSweep } from "./bookings.job";
