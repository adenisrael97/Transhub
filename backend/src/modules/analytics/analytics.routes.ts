/**
 * All analytics routes require admin role.
 * Middleware applied once at the router level rather than per-route.
 */
import { Router } from "express";
import { authenticate }  from "../../middleware/authenticate";
import { requireRole }   from "../../middleware/rbac";
import { validateQuery } from "../../middleware/validate";
import { analyticsController } from "./analytics.controller";
import { revenueQuerySchema }  from "./analytics.schema";

export const analyticsRouter = Router();

analyticsRouter.use(authenticate, requireRole("admin"));

analyticsRouter.get("/summary",   analyticsController.summary);
analyticsRouter.get("/revenue",   validateQuery(revenueQuerySchema), analyticsController.revenue);
analyticsRouter.get("/routes",    analyticsController.routes);
analyticsRouter.get("/operators", analyticsController.operators);
