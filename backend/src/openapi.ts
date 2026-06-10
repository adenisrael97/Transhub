/**
 * OpenAPI spec generator — lives at the app layer because it pulls together
 * every module's *.openapi.ts file. Infra (registry) is the only dependency
 * that flows upward; everything else flows correctly downward.
 *
 * ADDING A MODULE: import its *.openapi.ts here. That's it.
 * REMOVING OPENAPI:  delete this file + the *.openapi.ts files. Schema files
 *                    are unaffected — they contain only Zod validation logic.
 *
 * Each *.openapi.ts imports infra/openapi/init (which calls extendZodWithOpenApi)
 * as its first statement, so .openapi() is always available when it runs.
 * No import order fragility in app.ts required.
 */
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObject } from "openapi3-ts/oas30";
import { registry } from "./infra/openapi/registry";

// Explicit module registrations — order is irrelevant, list is exhaustive.
import "./modules/auth/auth.openapi";
import "./modules/operators/operators.openapi";
import "./modules/trips/trips.openapi";
import "./modules/bookings/bookings.openapi";
import "./modules/payments/payments.openapi";
import "./modules/tickets/tickets.openapi";
import "./modules/analytics/analytics.openapi";

let _spec: OpenAPIObject | null = null;

export function getSpec(): OpenAPIObject {
  if (_spec) return _spec;

  _spec = new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: {
      title: "TransHub API",
      version: "1.0.0",
      description:
        "E-ticketing bus marketplace. Passengers search routes, pick seats, pay, and receive tickets.",
    },
    servers: [{ url: "/", description: "Current host" }],
  }) as OpenAPIObject;

  return _spec;
}
