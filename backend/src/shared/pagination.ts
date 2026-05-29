/**
 * Pagination primitives shared across list endpoints. Lives in shared/ because
 * more than one module needs identical page/limit parsing + response shaping
 * (graduation rule #5).
 *
 * Contract: list endpoints accept ?page= & ?limit= and return
 *   { <key>: T[], pagination: { page, limit, total, totalPages } }
 * The array stays under its existing key so current clients keep working; the
 * pagination object is additive.
 */
import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;
/** Hard cap so a client can't request an unbounded page and defeat pagination. */
export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PageMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

/** A page of rows plus the unpaginated total — what repositories return. */
export interface Page<T> {
  items: T[];
  total: number;
}

/** Prisma skip/take from a validated page/limit. */
export function toSkipTake({ page, limit }: PaginationQuery): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}

/** Build the response pagination block from the total row count. */
export function pageMeta(total: number, { page, limit }: PaginationQuery): PageMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
