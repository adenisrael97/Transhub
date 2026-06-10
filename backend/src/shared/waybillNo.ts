import crypto from "crypto";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generate(): string {
  const year = new Date().getFullYear();
  // 6 random bytes → 6 alphanumeric chars from a 36-char set (uppercase A-Z + 0-9).
  // Math.random() is excluded deliberately: crypto.randomBytes gives OS-level entropy,
  // which matters here because waybill numbers are used for parcel lookup without auth.
  const bytes = crypto.randomBytes(6);
  const suffix = Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join("");
  return `WB-${year}-${suffix}`;
}

/**
 * Generate a unique waybill number.
 * On a unique-constraint collision (extremely rare) we retry once before throwing,
 * so the caller should catch ConflictError and return a 409.
 * The `tryInsert` callback attempts to persist the number; it should throw if the
 * number is already taken (unique constraint violation) and resolve otherwise.
 */
export async function generateWaybillNo(
  tryInsert: (no: string) => Promise<void>
): Promise<string> {
  const first = generate();
  try {
    await tryInsert(first);
    return first;
  } catch (err: unknown) {
    // Unique constraint violation from Postgres surfaces via Prisma as P2002.
    const isPrismaUnique =
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2002";
    if (!isPrismaUnique) throw err;

    // One retry on collision.
    const second = generate();
    await tryInsert(second);
    return second;
  }
}
