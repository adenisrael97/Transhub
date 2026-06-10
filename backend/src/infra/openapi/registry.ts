/**
 * Shared OpenAPI registry — the single source of truth for all schema
 * registrations and route definitions. Imported by every module's schema
 * file via .openapi() calls, then consumed by spec.ts to generate the doc.
 *
 * Lives in infra/ (plumbing, no business logic). Modules annotate their Zod
 * schemas with .openapi() but do not depend on this file directly — the
 * generator imports module schemas after extending Zod globally.
 */
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

// JWT bearer auth — referenced via `security: [{ bearerAuth: [] }]` on protected routes.
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});
