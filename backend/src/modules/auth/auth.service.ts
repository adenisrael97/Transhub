/**
 * Auth business logic: register, login, me. Knows nothing about HTTP.
 * Orchestrates the users module (via its public interface), password hashing,
 * and token signing.
 */
import argon2 from "argon2";
import { ConflictError, UnauthorizedError } from "../../shared/errors";
import { ARGON2_OPTIONS } from "../../shared/security";
import type { AuthUser } from "../../shared/types/auth";
import { usersService } from "../users";
import { driversService } from "../drivers";
import type { LoginInput, RegisterInput, DriverLoginInput } from "./auth.schema";
import { signAccessToken } from "./auth.tokens";

// Pre-compute a dummy hash at module load so the timing-safe login path is
// ready before the first request arrives (no per-request hash computation cost).
const dummyHashPromise = argon2.hash("noop", ARGON2_OPTIONS);

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
    const user = await usersService.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      password: passwordHash,
      // role defaults to "passenger" at the DB layer
    });

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
};
