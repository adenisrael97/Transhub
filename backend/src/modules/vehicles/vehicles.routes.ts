import { Router } from "express";
import { authenticate }  from "../../middleware/authenticate";
import { requireRole }   from "../../middleware/rbac";
import { validateBody, validateId, validateQuery } from "../../middleware/validate";
import { vehiclesController } from "./vehicles.controller";
import { createVehicleSchema, updateVehicleSchema, listVehiclesQuerySchema } from "./vehicles.schema";

export const vehiclesRouter = Router();

vehiclesRouter.use(authenticate, requireRole("operator"));

vehiclesRouter.get(  "/",    validateQuery(listVehiclesQuerySchema), vehiclesController.getFleet);
vehiclesRouter.post( "/",    validateBody(createVehicleSchema), vehiclesController.addVehicle);
vehiclesRouter.patch("/:id", validateId, validateBody(updateVehicleSchema), vehiclesController.updateVehicle);
vehiclesRouter.delete("/:id", validateId, vehiclesController.removeVehicle);
