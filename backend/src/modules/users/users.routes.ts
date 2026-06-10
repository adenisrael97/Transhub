/** User self-service routes + admin directory. */
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { usersController } from "./users.controller";
import { updateProfileSchema, changePasswordSchema, listUsersQuerySchema } from "./users.schema";

export const usersRouter = Router();

// Admin: paginated user/customer directory. Declared before /me is fine ("/" is
// a distinct path) but kept first for clarity.
usersRouter.get(
  "/",
  authenticate,
  requireRole("admin"),
  validateQuery(listUsersQuerySchema),
  usersController.list
);

usersRouter.get("/me", authenticate, usersController.getMe);

usersRouter.patch(
  "/me",
  authenticate,
  validateBody(updateProfileSchema),
  usersController.updateMe
);

usersRouter.patch(
  "/me/password",
  authenticate,
  validateBody(changePasswordSchema),
  usersController.changePassword
);
