import { Router } from "express";
import { authenticate }  from "../../middleware/authenticate";
import { requireRole }   from "../../middleware/rbac";
import { validateQuery } from "../../middleware/validate";
import { analyticsController } from "./analytics.controller";
import { revenueQuerySchema }  from "./analytics.schema";

export const analyticsRouter = Router();

// Operator stats — operator role only (scoped to their own data by operatorId from JWT)
analyticsRouter.get(
  "/operator",
  authenticate,
  requireRole("operator"),
  analyticsController.operatorStats
);

// Admin analytics — all routes below require admin role
analyticsRouter.use(authenticate, requireRole("admin"));

analyticsRouter.get("/summary",   analyticsController.summary);
analyticsRouter.get("/revenue",   validateQuery(revenueQuerySchema), analyticsController.revenue);
analyticsRouter.get("/routes",    analyticsController.routes);
analyticsRouter.get("/operators", analyticsController.operators);
