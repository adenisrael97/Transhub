import "../../infra/openapi/init";
import { z } from "zod";
import { registry } from "../../infra/openapi/registry";

registry.registerPath({
  method: "get",
  path: "/tickets",
  tags: ["Tickets"],
  summary: "List the passenger's confirmed tickets",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Paginated tickets with seat labels" } },
});

registry.registerPath({
  method: "get",
  path: "/tickets/{bookingId}",
  tags: ["Tickets"],
  summary: "Get a single ticket by booking ID",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ bookingId: z.uuid() }) },
  responses: {
    200: { description: "Ticket with trip, seats, and QR data" },
    404: { description: "Not found or not yours" },
  },
});
