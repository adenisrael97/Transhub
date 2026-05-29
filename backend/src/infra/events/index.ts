/**
 * Application-wide, strongly-typed event bus.
 *
 * This is the only mechanism for cross-module side effects — modules must never
 * call each other directly (architecture rule #4). A module emits an event; the
 * notifications module is the sole subscriber today.
 *
 * The AppEvents map makes event names and payloads compile-time checked. A typo
 * in an event name would otherwise silently drop the notification (no listener
 * matches); here it fails the build instead.
 */
import { EventEmitter } from "node:events";
import { logger } from "../logger";

export interface AppEvents {
  "booking.confirmed": {
    bookingId: string;
    userId: string;
    tripId: string;
    seatIds: string[];
    totalAmount: number;
    paymentRef: string | null;
  };
  "operator.approved": {
    email: string;
    contactName: string;
    companyName: string;
    tempPassword: string;
  };
}

const emitter = new EventEmitter();
emitter.setMaxListeners(20);

export const eventBus = {
  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): boolean {
    return emitter.emit(event, payload);
  },
  on<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): void {
    // Isolate subscribers: emit() invokes listeners synchronously, so a throwing
    // listener would propagate back to the emitter's caller (e.g. the booking-
    // confirm transaction). Decoupling (rule #4) means a notification bug must
    // never break the business flow — catch and log instead.
    emitter.on(event, (payload: AppEvents[K]) => {
      try {
        listener(payload);
      } catch (err) {
        logger.error({ err, event }, "Event listener threw");
      }
    });
  },
};
