import "../../infra/openapi/init";
import { z } from "zod";
import { registry } from "../../infra/openapi/registry";
import { createTripSchema, searchTripsQuerySchema, listTripsQuerySchema } from "./trips.schema";

registry.register("CreateTripInput", createTripSchema.openapi("CreateTripInput"));

registry.registerPath({
  method: "get",
  path: "/trips/search",
  tags: ["Trips"],
  summary: "Search available trips by route and date",
  request: { query: searchTripsQuerySchema },
  responses: {
    200: { description: "Matching trips with available seat counts" },
    400: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/trips",
  tags: ["Trips"],
  summary: "Create a trip (operator only)",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: createTripSchema } } } },
  responses: {
    201: { description: "Trip created with auto-generated seats" },
    400: { description: "Validation error" },
    403: { description: "Operator role required" },
  },
});

registry.registerPath({
  method: "get",
  path: "/trips",
  tags: ["Trips"],
  summary: "List trips (admin sees all; operator sees own)",
  security: [{ bearerAuth: [] }],
  request: { query: listTripsQuerySchema },
  responses: { 200: { description: "Paginated trips" } },
});

registry.registerPath({
  method: "get",
  path: "/trips/{id}",
  tags: ["Trips"],
  summary: "Get trip detail with available-seat count (public)",
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: { description: "Trip detail incl. availableSeats count" },
    404: { description: "Trip not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/trips/{id}",
  tags: ["Trips"],
  summary: "Delete a trip (operator, own trips only)",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    204: { description: "Deleted" },
    403: { description: "Not your trip" },
    404: { description: "Trip not found" },
  },
});
