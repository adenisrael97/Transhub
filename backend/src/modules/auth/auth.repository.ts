/**
 * Auth data access — the ONLY place that touches the `password_reset_tokens`
 * table (table-ownership rule: the auth module owns it). We persist the SHA-256
 * of the emailed token, never the raw value, so a DB leak can't be turned into a
 * working reset link.
 */
import type { PasswordResetToken } from "@prisma/client";
import { prisma } from "../../infra/db/client";

export const authRepository = {
  /** Issue a new reset grant for a user. */
  createResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data });
  },

  /** Look up a grant by its hashed token. Caller validates usedAt / expiresAt. */
  findResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  },

  /**
   * Remove every reset grant for a user. Called both when issuing a fresh link
   * (so only one is ever live) and after a successful reset (so the consumed
   * link — and any siblings — can't be replayed).
   */
  async deleteResetTokensForUser(userId: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
  },
};
