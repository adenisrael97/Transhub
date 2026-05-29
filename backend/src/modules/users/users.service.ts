/**
 * Users business logic + mappers. Wraps the repository and converts the raw
 * DB row (which includes the password hash) into safe shapes for the rest of
 * the app: never let the password hash leave this module.
 */
import type { Prisma, User } from "@prisma/client";
import type { AuthUser, Role } from "../../shared/types/auth";
import { usersRepository } from "./users.repository";

export type SafeUser = Omit<User, "password">;

export const usersService = {
  findByEmail(email: string): Promise<User | null> {
    // Normalize here too — defense-in-depth for any caller that didn't go
    // through the auth Zod schema (e.g. future admin lookups).
    return usersRepository.findByEmail(email.toLowerCase().trim());
  },

  findById(id: string): Promise<User | null> {
    return usersRepository.findById(id);
  },

  /** Pass `tx` when this create must be part of a larger DB transaction. */
  create(data: Prisma.UserCreateInput, tx?: Prisma.TransactionClient): Promise<User> {
    return usersRepository.create(data, tx);
  },

  /** Strip the password hash for any response leaving the API. */
  toSafeUser(user: User): SafeUser {
    const { password: _password, ...safe } = user;
    return safe;
  },

  /** The identity shape embedded in the JWT and attached to req.user. */
  toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as Role,
      // Spread operatorId only when it exists — keeps the JWT lean for
      // passengers/admins and lets AuthGuard read it without null checks.
      ...(user.operatorId != null && { operatorId: user.operatorId }),
    };
  },
};
