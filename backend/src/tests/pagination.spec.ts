import { describe, it, expect } from "vitest";
import {
  paginationQuerySchema,
  toSkipTake,
  pageMeta,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../shared/pagination";

describe("paginationQuerySchema", () => {
  it("applies defaults when params are absent", () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
  });

  it("coerces string query params to numbers", () => {
    expect(paginationQuerySchema.parse({ page: "3", limit: "25" })).toEqual({ page: 3, limit: 25 });
  });

  it("rejects a limit above the hard cap", () => {
    expect(paginationQuerySchema.safeParse({ limit: MAX_PAGE_SIZE + 1 }).success).toBe(false);
  });

  it("rejects page < 1 and non-integers", () => {
    expect(paginationQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ page: 1.5 }).success).toBe(false);
  });
});

describe("toSkipTake", () => {
  it("computes skip from page/limit", () => {
    expect(toSkipTake({ page: 1, limit: 20 })).toEqual({ skip: 0, take: 20 });
    expect(toSkipTake({ page: 3, limit: 20 })).toEqual({ skip: 40, take: 20 });
  });
});

describe("pageMeta", () => {
  it("derives totalPages by ceiling division", () => {
    expect(pageMeta(57, { page: 1, limit: 20 })).toEqual({ page: 1, limit: 20, total: 57, totalPages: 3 });
  });

  it("returns at least one page even with zero rows", () => {
    expect(pageMeta(0, { page: 1, limit: 20 }).totalPages).toBe(1);
  });
});
