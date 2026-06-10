/**
 * List-query primitives shared across filtered/searchable list endpoints.
 *
 * Complements shared/pagination.ts (page/limit + response shaping) with the
 * other three dimensions every admin/operator/customer list needs: sort,
 * date-range, numeric-range, and free-text search. Lives in shared/ because
 * 2+ modules need identical parsing + Prisma-filter shaping (graduation rule #5).
 *
 * Each module composes these into its own `*.schema.ts` query schema, e.g.
 *   z.object({ ...paginationQuerySchema.shape, ...searchSchema.shape, ...dateRangeSchema.shape })
 * and keeps its own enum of allowed filter values (status, vehicleType, …) so a
 * client can never inject an arbitrary column name or value.
 */
import { z } from "zod";

/**
 * TransHub operates in Nigeria (WAT = fixed UTC+1, no DST). Admin date filters
 * arrive as bare calendar days (YYYY-MM-DD); we anchor both ends to WAT so a
 * "2026-06-09" filter means that day in Lagos regardless of server timezone.
 */
export const WAT_OFFSET = "+01:00";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------
export const sortOrderSchema = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof sortOrderSchema>;

/**
 * Build a `{ sortBy, order }` schema constrained to an explicit allowlist of
 * sortable columns. Passing the allowlist (not a free string) is what keeps a
 * client from ordering by an unindexed/forbidden column.
 */
export function sortSchema<const T extends readonly [string, ...string[]]>(
  fields: T,
  defaultField: T[number],
  defaultOrder: SortOrder = "desc"
) {
  return z.object({
    sortBy: z.enum(fields).default(defaultField),
    order: sortOrderSchema.default(defaultOrder),
  });
}

// ---------------------------------------------------------------------------
// Free-text search
// ---------------------------------------------------------------------------
/** A capped free-text search term. Empty string is normalised away to undefined. */
export const searchSchema = z.object({
  search: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

// ---------------------------------------------------------------------------
// Date range (inclusive, WAT-anchored)
// ---------------------------------------------------------------------------
export const dateRangeSchema = z.object({
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
});

/**
 * Build a Prisma DateTime filter from optional YYYY-MM-DD bounds.
 * dateTo is inclusive to the end of that WAT day. Returns undefined when neither
 * bound is set so the caller can spread it conditionally into a `where`.
 */
export function toDateRange(
  dateFrom?: string,
  dateTo?: string
): { gte?: Date; lte?: Date } | undefined {
  const range: { gte?: Date; lte?: Date } = {};
  if (dateFrom) range.gte = new Date(`${dateFrom}T00:00:00.000${WAT_OFFSET}`);
  if (dateTo) range.lte = new Date(`${dateTo}T23:59:59.999${WAT_OFFSET}`);
  return range.gte || range.lte ? range : undefined;
}

// ---------------------------------------------------------------------------
// Numeric range (revenue / amount / price)
// ---------------------------------------------------------------------------
/** Build a Prisma numeric filter from optional min/max. Undefined when neither set. */
export function toNumberRange(
  min?: number,
  max?: number
): { gte?: number; lte?: number } | undefined {
  const range: { gte?: number; lte?: number } = {};
  if (min != null) range.gte = min;
  if (max != null) range.lte = max;
  return range.gte != null || range.lte != null ? range : undefined;
}

// ---------------------------------------------------------------------------
// CSV → string[] (for multi-select filters passed as ?key=a,b,c)
// ---------------------------------------------------------------------------
/**
 * Parse a comma-separated query value into a trimmed, de-duped string array.
 * Accepts either a single CSV string or an already-array value (axios bracket
 * serialization), so the endpoint is robust to either client convention.
 */
export const csvArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v): string[] => {
    if (v == null) return [];
    const parts = Array.isArray(v) ? v : v.split(",");
    return [...new Set(parts.map((p) => p.trim()).filter(Boolean))];
  });
