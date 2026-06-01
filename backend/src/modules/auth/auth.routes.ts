/** Auth routes: register, login (public) and me (protected). */
import { Router } from "express";
import { validateBody } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { authLimiter } from "../../middleware/rate-limit";
import { authController } from "./auth.controller";
import { driverLoginSchema, loginSchema, registerSchema } from "./auth.schema";

export const authRouter = Router();

authRouter.post("/register",      authLimiter, validateBody(registerSchema),    authController.register);
authRouter.post("/login",         authLimiter, validateBody(loginSchema),       authController.login);
authRouter.post("/driver/login",  authLimiter, validateBody(driverLoginSchema), authController.driverLogin);
authRouter.get("/me", authenticate, authController.me);
