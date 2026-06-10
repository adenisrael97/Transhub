/** Auth routes: register, login (public) and me (protected). */
import { Router } from "express";
import { validateBody } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { authLimiter } from "../../middleware/rate-limit";
import { authController } from "./auth.controller";
import {
  driverLoginSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema";

export const authRouter = Router();

authRouter.post("/register",        authLimiter, validateBody(registerSchema),       authController.register);
authRouter.post("/login",           authLimiter, validateBody(loginSchema),          authController.login);
authRouter.post("/driver/login",    authLimiter, validateBody(driverLoginSchema),    authController.driverLogin);
// Password reset (public). authLimiter blunts email-spam / token-guessing abuse.
authRouter.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
authRouter.post("/reset-password",  authLimiter, validateBody(resetPasswordSchema),  authController.resetPassword);
authRouter.get("/me", authenticate, authController.me);
