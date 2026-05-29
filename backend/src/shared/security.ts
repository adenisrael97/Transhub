/**
 * Security constants shared across modules that hash passwords.
 * Centralised here so auth and operators always use identical parameters —
 * a divergence would silently create hashes with different security properties.
 *
 * Values meet OWASP ASVS 4.0 minimum requirements for argon2id.
 */
import argon2 from "argon2";

export const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;
