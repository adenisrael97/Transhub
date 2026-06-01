/**
 * Drivers business logic.
 * Operators create and manage drivers for their own fleet.
 * verifyCredentials is used by the auth module for driver login.
 */
import argon2 from "argon2";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../shared/errors";

import { ARGON2_OPTIONS } from "../../shared/security";
import type { AuthUser } from "../../shared/types/auth";
import { driversRepository, type DriverDTO } from "./drivers.repository";
import type { CreateDriverInput, UpdateDriverInput } from "./drivers.schema";

// Pre-compute a dummy hash so timing is consistent even when the phone isn't found.
const dummyHashPromise = argon2.hash("noop", ARGON2_OPTIONS);

export const driversService = {
  /** Operator creates a driver. Phone must be globally unique (it is the login credential). */
  async create(input: CreateDriverInput, operatorId: string): Promise<DriverDTO> {
    const existing = await driversRepository.findByPhone(input.phone);
    if (existing) {
      throw new ConflictError("A driver with this phone number already exists");
    }
    const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS);
    return driversRepository.create({ ...input, operatorId, passwordHash });
  },

  /** List all drivers belonging to this operator. */
  listByOperator(operatorId: string): Promise<DriverDTO[]> {
    return driversRepository.findAll(operatorId);
  },

  /** Get a single driver — ownership scoped to the calling operator. */
  async getById(id: string, operatorId: string): Promise<DriverDTO> {
    const driver = await driversRepository.findById(id, operatorId);
    if (!driver) throw new NotFoundError("Driver not found");
    return driver;
  },

  /** Update mutable driver fields. Phone is not updatable (it is the login credential). */
  async update(id: string, operatorId: string, data: UpdateDriverInput): Promise<DriverDTO> {
    const driver = await driversRepository.update(id, operatorId, data);
    if (!driver) throw new NotFoundError("Driver not found");
    return driver;
  },

  /**
   * Return an AuthUser for a driver looked up by their Driver.id.
   * Used by GET /auth/me so a driver's session can be refreshed without
   * hitting the users table (drivers live in the drivers table, not users).
   */
  async getAuthUserById(id: string): Promise<AuthUser> {
    const driver = await driversRepository.findById(id);
    if (!driver) throw new UnauthorizedError("Driver account no longer exists");
    if (!driver.isActive) throw new UnauthorizedError("Driver account has been deactivated");
    return {
      id:         driver.id,
      fullName:   driver.fullName,
      phone:      driver.phone,
      role:       "driver",
      operatorId: driver.operatorId,
    };
  },

  /** Soft-delete a driver (isActive=false). Their assigned trips keep the FK. */
  async deactivate(id: string, operatorId: string): Promise<void> {
    const ok = await driversRepository.deactivate(id, operatorId);
    if (!ok) throw new NotFoundError("Driver not found");
  },

  /**
   * Verify login credentials for a driver.
   * Always runs argon2.verify — even when phone doesn't exist — so both
   * "wrong phone" and "wrong password" take the same wall-clock time and
   * an attacker cannot enumerate valid phone numbers via timing.
   *
   * Returns the DriverDTO + an AuthUser payload ready to be signed into a JWT.
   */
  async verifyCredentials(
    phone:    string,
    password: string
  ): Promise<{ driver: DriverDTO; authUser: AuthUser }> {
    const row = await driversRepository.findByPhone(phone);

    const hashToCheck = row?.password ?? (await dummyHashPromise);
    const valid = await argon2.verify(hashToCheck, password).catch(() => false);

    if (!row || !valid) {
      throw new UnauthorizedError("Invalid phone number or password");
    }
    if (!row.isActive) {
      throw new UnauthorizedError("Driver account has been deactivated");
    }

    const { password: _pw, ...driver } = row;

    const authUser: AuthUser = {
      id:         driver.id,
      fullName:   driver.fullName,
      phone:      driver.phone,
      role:       "driver",
      operatorId: driver.operatorId,
      // email intentionally omitted — drivers have no email
    };

    return { driver, authUser };
  },
};
