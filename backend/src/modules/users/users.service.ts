/**
 * Users business logic + mappers. Wraps the repository and converts the raw
 * DB row (which includes the password hash) into safe shapes for the rest of
 * the app: never let the password hash leave this module.
 */
import argon2 from "argon2";
import type { Prisma, User } from "@prisma/client";
import type { AuthUser, Role } from "../../shared/types/auth";
import { ValidationError, NotFoundError, ConflictError } from "../../shared/errors";
import { ARGON2_OPTIONS } from "../../shared/security";
import { signAccessToken } from "../../shared/tokens";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import { usersRepository, type UserListFilter, type AdminUserDTO } from "./users.repository";
import type { UpdateProfileInput } from "./users.schema";

export type SafeUser = Omit<User, "password">;

/** A profile update returns the new identity AND a freshly-signed token: the old
 *  JWT embeds the now-stale name/email/phone, so the client must swap it in. */
export interface UpdatedProfile {
  user: SafeUser;
  token: string;
}

/** Just the claims toAuthUser/signAccessToken read — lets callers pass a User OR
 *  a SafeUser (password-stripped) without a cast. */
type Identity = Pick<User, "id" | "email" | "fullName" | "phone" | "role" | "operatorId">;

export const usersService = {
  findByEmail(email: string): Promise<User | null> {
    // Normalize here too — defense-in-depth for any caller that didn't go
    // through the auth Zod schema (e.g. future admin lookups).
    return usersRepository.findByEmail(email.toLowerCase().trim());
  },

  findById(id: string): Promise<User | null> {
    return usersRepository.findById(id);
  },

  /** Admin: paginated user/customer directory with role filter + search. */
  async list(
    filter: UserListFilter,
    pagination: PaginationQuery
  ): Promise<{ users: AdminUserDTO[]; pagination: PageMeta }> {
    const { items, total } = await usersRepository.findAll(filter, pagination);
    return { users: items, pagination: pageMeta(total, pagination) };
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

  /** The identity shape embedded in the JWT and attached to req.user. Accepts a
   *  full User or a password-stripped SafeUser — it only reads identity claims. */
  toAuthUser(user: Identity): AuthUser {
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

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return usersService.toSafeUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UpdatedProfile> {
    const current = await usersRepository.findById(userId);
    if (!current) throw new NotFoundError("User not found");

    const data: { fullName?: string; email?: string; phone?: string } = {};
    if (input.name  !== undefined) data.fullName = input.name;
    if (input.phone !== undefined) data.phone    = input.phone;

    // Email is unique. Only touch it when it actually changes, and guard the
    // uniqueness here with a clear 409 rather than leaking Prisma's P2002 as a 500.
    if (input.email !== undefined && input.email !== current.email) {
      const taken = await usersRepository.findByEmail(input.email);
      if (taken) throw new ConflictError("That email is already in use");
      data.email = input.email;
    }

    const updated = await usersRepository.updateProfile(userId, data);
    const safe = usersService.toSafeUser(updated);
    // Re-mint the token so the client's decoded identity (name/email/phone shown
    // in the navbar etc.) matches the DB immediately and survives a reload.
    return { user: safe, token: signAccessToken(usersService.toAuthUser(updated)) };
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    const valid = await argon2.verify(user.password, currentPassword);
    // 400 (not 401): the request IS authenticated — a wrong current password is a
    // bad input, not an expired session. Returning 401 would make the SPA's global
    // "401 ⇒ log out" interceptor sign the user out mid-change instead of showing
    // an inline field error.
    if (!valid) throw new ValidationError("Current password is incorrect");
    const hash = await argon2.hash(newPassword, ARGON2_OPTIONS);
    await usersRepository.updatePassword(userId, hash);
  },

  /**
   * Set a new password WITHOUT knowing the old one. The caller (auth's
   * password-reset flow) is responsible for proving the request is legitimate
   * via a single-use reset token — so unlike changePassword there's no current-
   * password check here. Hashing stays in this module so the users table is the
   * only place that ever turns a plaintext password into a stored hash.
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const hash = await argon2.hash(newPassword, ARGON2_OPTIONS);
    await usersRepository.updatePassword(userId, hash);
  },
};
