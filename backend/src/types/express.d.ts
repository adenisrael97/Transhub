/**
 * Augments Express's Request type with the fields our middleware attaches,
 * so `req.id` is typed across the app instead of needing casts.
 */
import "express";
import type { AuthUser } from "../shared/types/auth";

declare global {
  namespace Express {
    interface Request {
      id: string;
      /** Set by the authenticate middleware on protected routes. */
      user?: AuthUser;
    }
  }
}

export {};
