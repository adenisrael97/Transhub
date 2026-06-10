/**
 * Operators data access — the ONLY place that touches the `operators` table.
 * (Table-ownership rule: this module owns operators; no other module writes here.)
 *
 * Mutating methods accept an optional Prisma transaction client so the
 * approve flow can span users + operators atomically.
 */
import type { Operator, Prisma } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";
import type { RegisterOperatorInput, UpdateOperatorProfileInput } from "./operators.schema";

type Tx = Prisma.TransactionClient;

export const operatorsRepository = {
  findByEmail(email: string, tx?: Tx): Promise<Operator | null> {
    return (tx ?? prisma).operator.findUnique({ where: { email } });
  },

  findById(id: string, tx?: Tx): Promise<Operator | null> {
    return (tx ?? prisma).operator.findUnique({ where: { id } });
  },

  async findAll(
    filter: { status?: "pending" | "approved" | "declined"; search?: string },
    pagination: PaginationQuery
  ): Promise<Page<Operator>> {
    const and: Prisma.OperatorWhereInput[] = [];
    if (filter.status) and.push({ status: filter.status });
    if (filter.search) {
      const s = filter.search;
      and.push({
        OR: [
          { companyName: { contains: s, mode: "insensitive" } },
          { contactName: { contains: s, mode: "insensitive" } },
          { email:       { contains: s, mode: "insensitive" } },
          { city:        { contains: s, mode: "insensitive" } },
        ],
      });
    }
    const where: Prisma.OperatorWhereInput | undefined = and.length ? { AND: and } : undefined;
    const [items, total] = await prisma.$transaction([
      prisma.operator.findMany({
        where,
        orderBy: { appliedAt: "desc" },
        ...toSkipTake(pagination),
      }),
      prisma.operator.count({ where }),
    ]);
    return { items, total };
  },

  create(data: RegisterOperatorInput): Promise<Operator> {
    return prisma.operator.create({ data });
  },

  /** Return all approved operators — used by admin waybill assignment dropdown. */
  findApproved(): Promise<Pick<Operator, "id" | "companyName" | "city">[]> {
    return prisma.operator.findMany({
      where:   { status: "approved" },
      select:  { id: true, companyName: true, city: true },
      orderBy: { companyName: "asc" },
    });
  },

  updateProfile(
    id: string,
    data: UpdateOperatorProfileInput,
    tx?: Tx
  ): Promise<Operator> {
    return (tx ?? prisma).operator.update({ where: { id }, data });
  },

  /**
   * Atomically transition a PENDING application to approved/declined.
   *
   * Uses `updateMany` with a `status: "pending"` guard in the WHERE clause so
   * the transition is conditional at the DB level: a concurrent reviewer (or a
   * double-clicked button) that already moved the row sees `count === 0` and
   * the service aborts. This closes the read-then-write race that a plain
   * `update` (which only matches on id) would leave open.
   */
  markReviewedIfPending(
    id: string,
    status: "approved" | "declined",
    tx?: Tx
  ): Promise<Prisma.BatchPayload> {
    return (tx ?? prisma).operator.updateMany({
      where: { id, status: "pending" },
      data: { status, reviewedAt: new Date() },
    });
  },
};
