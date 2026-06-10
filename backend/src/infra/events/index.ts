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
  // Emitted by authService.requestPasswordReset. resetUrl carries the one-time
  // raw token in its query string, so the notifications job that sends it uses
  // removeOnComplete to purge the payload from Redis once delivered.
  "auth.password_reset_requested": {
    email: string;
    fullName: string;
    resetUrl: string;
  };
  "booking.confirmed": {
    bookingId: string;
    userId: string;
    tripId: string;
    seatIds: string[];
    totalAmount: number;
    paymentRef: string | null;
  };
  "booking.created": {
    operatorId: string;
    bookingId: string;
    tripId: string;
  };
  "operator.approved": {
    email: string;
    contactName: string;
    companyName: string;
    tempPassword: string;
  };
  "trip.capacityChanged": {
    tripId: string;
    isFull: boolean;
    offlineCount: number;
  };
  "charter.requested": {
    charterId:      string;
    passengerId:    string;
    passengerName:  string;
    passengerEmail: string;
    fromLocation:   string;
    toLocation:     string;
    departureAt:    string; // ISO-8601
    vehicleType:    string;
  };
  "charter.quoted": {
    charterId:      string;
    passengerId:    string;
    passengerName:  string;
    passengerEmail: string;
    quotedPrice:    number; // naira
    fromLocation:   string;
    toLocation:     string;
    departureAt:    string; // ISO-8601
  };
  "charter.confirmed": {
    charterId:      string;
    passengerId:    string;
    passengerName:  string;
    passengerEmail: string;
    fromLocation:   string;
    toLocation:     string;
    departureAt:    string; // ISO-8601
    vehicleType:    string;
    quotedPrice:    number; // naira
  };
  // Emitted by chartersService.adminConfirmBooking after updating operator/pickup/travel info.
  "charter.booking_confirmed": {
    charterId:        string;
    passengerId:      string;
    passengerName:    string;
    passengerEmail:   string;
    fromLocation:     string;
    toLocation:       string;
    departureAt:      string; // ISO-8601
    assignedOperator: string;
    pickupInfo:       string;
    travelInfo:       string;
  };
  // Emitted by chartersService.completeCharter.
  "charter.completed": {
    charterId:      string;
    passengerId:    string;
    passengerName:  string;
    passengerEmail: string;
    fromLocation:   string;
    toLocation:     string;
    departureAt:    string; // ISO-8601
  };
  // Emitted by payments webhook handler; charters module subscribes to confirm DB state.
  // Using the event bus here (not a direct service call) breaks the payments ↔ charters
  // circular import that would otherwise form through controller → payments → charters.
  "payment.charter.succeeded": {
    charterId:         string;
    reference:         string;
    paidAt:            Date;
    webhookAmountKobo: number;
  };
  // Emitted by payments webhook handler; waybills module subscribes to confirm payment.
  // webhookAmountKobo is re-verified against the DB fee before confirming (anti-fraud).
  "payment.waybill.succeeded": {
    waybillId:         string;
    paidAt:            Date;
    webhookAmountKobo: number;
  };
  // Emitted by waybillsService when admin sends a quote.
  "waybill.quote_sent": {
    waybillId:     string;
    waybillNo:     string;
    senderName:    string;
    customerEmail: string; // sender's account email (may be "") — for the "quote ready" notification
    quoteAmount:   number;
    fromLocation:  string;
    toLocation:    string;
    userId:        string;
  };
  // Emitted by waybillsService on every status change; bridged to socket rooms
  // so the public tracking page updates live without a manual refresh.
  "waybill.tracking_updated": {
    waybillNo: string;
    status:    string;
    events: {
      id:        string;
      status:    string;
      location:  string | null;
      note:      string | null;
      createdAt: Date;
    }[];
  };
  // Emitted by waybillsService after DB confirms payment.
  "waybill.paid": {
    waybillId:    string;
    waybillNo:    string;
    senderName:   string;
    senderPhone:  string;
    senderEmail:  string;
    fromLocation: string;
    toLocation:   string;
  };
  // Emitted by waybillsService when status transitions to 'delivered'.
  "waybill.delivered": {
    waybillId:      string;
    waybillNo:      string;
    recipientName:  string;
    recipientPhone: string;
    fromLocation:   string;
    toLocation:     string;
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
