/**
 * Auth business logic: register, login, me. Knows nothing about HTTP.
 * Orchestrates the users module (via its public interface), password hashing,
 * and token signing.
 */
import argon2 from "argon2";
import { Prisma, type User } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { ConflictError, UnauthorizedError, ValidationError } from "../../shared/errors";
import { ARGON2_OPTIONS } from "../../shared/security";
import type { AuthUser } from "../../shared/types/auth";
import { env } from "../../config/env";
import { eventBus } from "../../infra/events";
import { logger } from "../../infra/logger";
import { usersService } from "../users";
import { driversService } from "../drivers";
import type { LoginInput, RegisterInput, DriverLoginInput } from "./auth.schema";
import { signAccessToken } from "../../shared/tokens";
import { authRepository } from "./auth.repository";

// Pre-compute a dummy hash at module load so the timing-safe login path is
// ready before the first request arrives (no per-request hash computation cost).
const dummyHashPromise = argon2.hash("noop", ARGON2_OPTIONS);

// How long an emailed reset link stays valid. Short window limits the blast
// radius if a link leaks (forwarded email, shared inbox, browser history).
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// SHA-256 is the right primitive here (not argon2): the token is already 256
// bits of CSPRNG entropy, so it isn't brute-forceable — we only need a fast,
// deterministic one-way map to look it up by hash without storing the raw value.
function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

interface AuthResult {
  token: string;
  user: AuthUser;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await usersService.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS);
    let user: User;
    try {
      user = await usersService.create({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        password: passwordHash,
        // role defaults to "passenger" at the DB layer
      });
    } catch (err) {
      // The findByEmail pre-check above is not a lock: two concurrent signups (or
      // a duplicated request) with the same email can both pass it and race into
      // create(), where the `users.email` @unique constraint lets only one win.
      // Map the loser's P2002 to the same clean conflict the pre-check returns so
      // the client never sees the central handler's generic "Resource already exists".
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("An account with this email already exists");
      }
      throw err;
    }

    const authUser = usersService.toAuthUser(user);
    return { token: signAccessToken(authUser), user: authUser };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await usersService.findByEmail(input.email);

    // Always run argon2.verify — even when the email doesn't exist — so both
    // "wrong email" and "wrong password" paths take the same wall-clock time.
    // Without this, an attacker can enumerate valid emails via response timing.
    const hashToCheck = user?.password ?? (await dummyHashPromise);
    const passwordValid = await argon2
      .verify(hashToCheck, input.password)
      .catch(() => false);

    if (!user || !passwordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const authUser = usersService.toAuthUser(user);
    return { token: signAccessToken(authUser), user: authUser };
  },

  /**
   * Driver login — phone + password only.
   * Timing-safe: driversService.verifyCredentials always runs argon2.verify.
   */
  async driverLogin(input: DriverLoginInput): Promise<{ token: string; user: AuthUser }> {
    const { authUser } = await driversService.verifyCredentials(input.phone, input.password);
    return { token: signAccessToken(authUser), user: authUser };
  },

  /**
   * Re-read the identity from the DB so role/profile changes are always fresh.
   * Drivers live in the `drivers` table; all other roles live in `users`.
   * We branch here so a driver JWT (whose id is a Driver.id, not a User.id)
   * doesn't falsely hit "Account no longer exists" when the users table is queried.
   */
  async me(userId: string, role: string): Promise<AuthUser> {
    if (role === "driver") {
      return driversService.getAuthUserById(userId);
    }
    const user = await usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedError("Account no longer exists");
    }
    return usersService.toAuthUser(user);
  },

  /**
   * Step 1 — issue a reset link. ALWAYS resolves successfully whether or not the
   * email maps to an account: the controller returns the same response either
   * way so an attacker can't use this endpoint to enumerate registered emails.
   * Only the users table is consulted — drivers reset via their operator, not here.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await usersService.findByEmail(email);
    if (!user) {
      logger.info({ email }, "Password reset requested for unknown email — no-op");
      return;
    }

    // 32 bytes = 256 bits of entropy. The raw token goes in the email link only;
    // the DB stores its hash. randomBytes is a CSPRNG (safe for security tokens).
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    // Invalidate any prior outstanding links first so only the newest one works.
    await authRepository.deleteResetTokensForUser(user.id);
    await authRepository.createResetToken({ userId: user.id, tokenHash, expiresAt });

    // Cross-module side effect goes through the event bus (rule #4): auth must
    // not know the notifications module exists. The raw token rides in the URL.
    eventBus.emit("auth.password_reset_requested", {
      email: user.email,
      fullName: user.fullName,
      resetUrl: `${env.FRONTEND_URL}/auth/reset-password?token=${rawToken}`,
    });

    logger.info({ userId: user.id }, "Password reset link issued");
  },

  /**
   * Step 2 — redeem the emailed token for a new password. Rejects tokens that
   * are unknown, already used, or expired. On success the password is updated
   * and ALL of the user's reset tokens are purged so the link can't be replayed.
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashResetToken(rawToken);
    const token = await authRepository.findResetTokenByHash(tokenHash);

    // One generic message for every failure mode — never reveal which part was wrong.
    const invalid = (): never => {
      throw new ValidationError("This password reset link is invalid or has expired");
    };

    if (!token) invalid();
    if (token!.usedAt) invalid();
    if (token!.expiresAt.getTime() < Date.now()) invalid();

    await usersService.resetPassword(token!.userId, newPassword);
    // Purge the consumed token (and any siblings) — belt-and-braces single use.
    await authRepository.deleteResetTokensForUser(token!.userId);

    logger.info({ userId: token!.userId }, "Password reset completed");
  },
};
