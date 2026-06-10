import "../../infra/openapi/init";
import { z } from "zod";
import { registry } from "../../infra/openapi/registry";
import { holdSchema } from "./bookings.schema";

registry.register("HoldInput", holdSchema.openapi("HoldInput"));

registry.registerPath({
  method: "post",
  path: "/bookings/hold",
  tags: ["Bookings"],
  summary: "Hold N seats for checkout (passenger only)",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: holdSchema } } } },
  responses: {
    201: { description: "Hold created, expires in 10 minutes" },
    400: { description: "Validation error" },
    409: { description: "Not enough seats available" },
  },
});

registry.registerPath({
  method: "get",
  path: "/bookings",
  tags: ["Bookings"],
  summary: "List bookings (own for passenger, all for admin)",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Paginated bookings" } },
});

registry.registerPath({
  method: "get",
  path: "/bookings/{id}",
  tags: ["Bookings"],
  summary: "Get booking detail",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: { description: "Booking detail" },
    404: { description: "Not found or not yours" },
  },
});
