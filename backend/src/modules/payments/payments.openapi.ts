import "../../infra/openapi/init";
import { z } from "zod";
import { registry } from "../../infra/openapi/registry";
import { initializeSchema } from "./payments.schema";

registry.register("InitializePaymentInput", initializeSchema.openapi("InitializePaymentInput"));

registry.registerPath({
  method: "post",
  path: "/payments/initialize",
  tags: ["Payments"],
  summary: "Initialize a Paystack transaction for the caller's held seats",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: initializeSchema } } } },
  responses: {
    200: { description: "Paystack authorization URL" },
    409: { description: "No active hold — seats expired or never held" },
  },
});

registry.registerPath({
  method: "get",
  path: "/payments/verify/{reference}",
  tags: ["Payments"],
  summary: "Poll payment status after Paystack redirect",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ reference: z.string().min(1) }) },
  responses: { 200: { description: "Payment status (success | pending | failed)" } },
});

registry.registerPath({
  method: "post",
  path: "/payments/webhook",
  tags: ["Payments"],
  summary: "Paystack webhook — server-to-server only",
  responses: {
    200: { description: "Acknowledged" },
    400: { description: "Invalid signature or payload" },
  },
});
