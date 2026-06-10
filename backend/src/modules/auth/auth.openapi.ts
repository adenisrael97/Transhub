import "../../infra/openapi/init";
import { registry } from "../../infra/openapi/registry";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema";

registry.register("RegisterInput",       registerSchema.openapi("RegisterInput"));
registry.register("LoginInput",          loginSchema.openapi("LoginInput"));
registry.register("ForgotPasswordInput", forgotPasswordSchema.openapi("ForgotPasswordInput"));
registry.register("ResetPasswordInput",  resetPasswordSchema.openapi("ResetPasswordInput"));

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register a new passenger account",
  request: { body: { content: { "application/json": { schema: registerSchema } } } },
  responses: {
    201: { description: "Account created, JWT returned" },
    400: { description: "Validation error" },
    409: { description: "Email already registered" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Log in and receive a JWT",
  request: { body: { content: { "application/json": { schema: loginSchema } } } },
  responses: {
    200: { description: "JWT access token" },
    400: { description: "Validation error" },
    401: { description: "Invalid credentials" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/forgot-password",
  tags: ["Auth"],
  summary: "Request a password reset link by email",
  description:
    "Always returns 200 with a generic message whether or not the email is registered, to prevent account enumeration.",
  request: { body: { content: { "application/json": { schema: forgotPasswordSchema } } } },
  responses: {
    200: { description: "Generic acknowledgement (link sent if the account exists)" },
    400: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/reset-password",
  tags: ["Auth"],
  summary: "Redeem a reset token and set a new password",
  request: { body: { content: { "application/json": { schema: resetPasswordSchema } } } },
  responses: {
    200: { description: "Password updated — the user can now log in" },
    400: { description: "Validation error, or invalid/expired token" },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Return the authenticated user profile",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "User profile" },
    401: { description: "Missing or invalid token" },
  },
});
