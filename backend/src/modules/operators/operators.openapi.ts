import "../../infra/openapi/init";
import { z } from "zod";
import { registry } from "../../infra/openapi/registry";
import { registerOperatorSchema, listOperatorsQuerySchema } from "./operators.schema";

registry.register("RegisterOperatorInput", registerOperatorSchema.openapi("RegisterOperatorInput"));

registry.registerPath({
  method: "post",
  path: "/operators/register",
  tags: ["Operators"],
  summary: "Submit an operator onboarding application",
  request: { body: { content: { "application/json": { schema: registerOperatorSchema } } } },
  responses: {
    201: { description: "Application received" },
    400: { description: "Validation error" },
    409: { description: "Email already applied" },
  },
});

registry.registerPath({
  method: "get",
  path: "/operators",
  tags: ["Operators"],
  summary: "List operator applications (admin only)",
  security: [{ bearerAuth: [] }],
  request: { query: listOperatorsQuerySchema },
  responses: {
    200: { description: "Paginated list of operators" },
    401: { description: "Unauthorized" },
    403: { description: "Admin role required" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/operators/{id}/approve",
  tags: ["Operators"],
  summary: "Approve a pending operator application",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: { description: "Operator approved, user account created" },
    404: { description: "Application not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/operators/{id}/decline",
  tags: ["Operators"],
  summary: "Decline a pending operator application",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: { description: "Operator declined" },
    404: { description: "Application not found" },
  },
});
