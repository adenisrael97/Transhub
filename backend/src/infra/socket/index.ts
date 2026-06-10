/**
 * Socket.io server — real-time trip capacity updates.
 *
 * Passengers on the trip detail page subscribe to a trip room; when an operator
 * marks a trip full (or updates offline count), the event bus fires
 * "trip.capacityChanged" and this module broadcasts it to all subscribers.
 *
 * No business logic lives here — this is pure infrastructure plumbing.
 */
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { corsOrigins } from "../../config/env";
import { logger } from "../logger";
import { eventBus } from "../events";
import { verifyAccessToken } from "../../shared/tokens";

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin:      corsOrigins,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Optional auth: a valid JWT lets us auto-join role-scoped rooms (operators get
  // their booking feed). Anonymous sockets are still allowed — public trip rooms
  // need no identity — so a missing/invalid token never rejects the connection.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        socket.data.user = verifyAccessToken(token);
      } catch {
        /* ignore — treat as anonymous */
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    // Operators auto-join their own room so they receive live booking events for
    // their trips. operatorId is read from the verified token, never the client.
    const user = socket.data.user as { role?: string; operatorId?: string } | undefined;
    if (user?.role === "operator" && user.operatorId) {
      void socket.join(`operator:${user.operatorId}`);
    }

    // Passengers subscribe to a specific trip room to get capacity updates
    socket.on("trip:subscribe", (tripId: string) => {
      if (typeof tripId === "string" && tripId.length > 0) {
        void socket.join(`trip:${tripId}`);
      }
    });

    socket.on("trip:unsubscribe", (tripId: string) => {
      if (typeof tripId === "string") {
        void socket.leave(`trip:${tripId}`);
      }
    });

    // Anyone tracking a parcel joins that waybill's public room to receive live
    // status pushes. The waybill number is the public tracking token, so no auth
    // is required — same trust model as the unauthenticated GET /waybills/:no.
    socket.on("track:waybill", (waybillNo: string) => {
      if (typeof waybillNo === "string" && waybillNo.length > 0) {
        void socket.join(`waybill:${waybillNo}`);
      }
    });

    socket.on("untrack:waybill", (waybillNo: string) => {
      if (typeof waybillNo === "string") {
        void socket.leave(`waybill:${waybillNo}`);
      }
    });
  });

  // Bridge from the internal event bus → socket rooms
  eventBus.on("trip.capacityChanged", ({ tripId, isFull, offlineCount }) => {
    io?.to(`trip:${tripId}`).emit("trip:capacityChanged", { tripId, isFull, offlineCount });
  });

  // A new booking landed → nudge the owning operator's dashboard to refresh.
  eventBus.on("booking.created", ({ operatorId, bookingId, tripId }) => {
    io?.to(`operator:${operatorId}`).emit("booking:created", { bookingId, tripId });
  });

  // Waybill status changed → push the new status + timeline to trackers in real time.
  eventBus.on("waybill.tracking_updated", ({ waybillNo, status, events }) => {
    io?.to(`waybill:${waybillNo}`).emit("waybill:update", { status, events });
  });

  logger.info("Socket.io server initialized");
  return io;
}

/**
 * Force-disconnect every connected client during graceful shutdown. Open
 * websocket connections are long-lived and would otherwise keep the HTTP
 * server's `close()` callback from ever firing (forcing the hard-timeout exit).
 * We disconnect the sockets but leave the HTTP server for server.ts to close,
 * so there's a single owner of the listener's lifecycle.
 */
export function disconnectAllSockets(): void {
  io?.disconnectSockets(true);
}

export { io };
