/** Auth routes: register, login (public) and me (protected). */
import { Router } from "express";
import { validateBody } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { rateLimit } from "../../middleware/rate-limit";
import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schema";

export const authRouter = Router();

// Throttle pre-auth endpoints (per IP) to blunt credential stuffing / signup abuse.
const loginLimiter    = rateLimit({ keyPrefix: "login", max: 10, windowSec: 60 });
const registerLimiter = rateLimit({ keyPrefix: "register", max: 5, windowSec: 60 });

authRouter.post("/register", registerLimiter, validateBody(registerSchema), authController.register);
authRouter.post("/login", loginLimiter, validateBody(loginSchema), authController.login);
authRouter.get("/me", authenticate, authController.me);
