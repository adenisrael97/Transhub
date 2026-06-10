import "../../infra/openapi/init";
import { registry } from "../../infra/openapi/registry";
import { revenueQuerySchema } from "./analytics.schema";

registry.registerPath({
  method: "get",
  path: "/analytics/summary",
  tags: ["Analytics"],
  summary: "Platform KPI summary (admin only)",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Total bookings, revenue, active trips, users" } },
});

registry.registerPath({
  method: "get",
  path: "/analytics/revenue",
  tags: ["Analytics"],
  summary: "Daily revenue for the last N days",
  security: [{ bearerAuth: [] }],
  request: { query: revenueQuerySchema },
  responses: { 200: { description: "Array of {date, amount}" } },
});

registry.registerPath({
  method: "get",
  path: "/analytics/routes",
  tags: ["Analytics"],
  summary: "Top routes by booking volume",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Array of {from, to, bookings}" } },
});

registry.registerPath({
  method: "get",
  path: "/analytics/operators",
  tags: ["Analytics"],
  summary: "Top operators by revenue",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Array of {operator, revenue, trips}" } },
});
