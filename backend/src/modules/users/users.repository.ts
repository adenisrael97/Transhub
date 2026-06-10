/**
 * Users data access — the ONLY place that touches the `users` table.
 * (Table-ownership rule: the users module owns this table; other modules
 * must go through users' public interface, never query users directly.)
 *
 * All mutating methods accept an optional Prisma transaction client (`tx`)
 * so callers that span multiple tables can include user writes in a single
 * atomic transaction without bypassing the repository layer.
 */
import type { Prisma, Role, User } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";
import { toDateRange } from "../../shared/list-query";

type Tx = Prisma.TransactionClient;

/** Admin directory filters (see listUsersQuerySchema). */
export interface UserListFilter {
  role?:     string;
  dateFrom?: string;
  dateTo?:   string;
  search?:   string;
}

/** Safe admin-facing user row — no password, plus activity counts. */
export interface AdminUserDTO {
  id:         string;
  fullName:   string;
  email:      string;
  phone:      string;
  role:       string;
  operatorId: string | null;
  createdAt:  string;
  counts:     { bookings: number; charters: number; waybills: number };
}

function buildUserWhere(filter: UserListFilter): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [];
  if (filter.role) and.push({ role: filter.role as Role });
  const created = toDateRange(filter.dateFrom, filter.dateTo);
  if (created) and.push({ createdAt: created });
  if (filter.search) {
    const s = filter.search;
    and.push({
      OR: [
        { fullName: { contains: s, mode: "insensitive" } },
        { email:    { contains: s, mode: "insensitive" } },
        { phone:    { contains: s, mode: "insensitive" } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export const usersRepository = {
  findByEmail(email: string, tx?: Tx): Promise<User | null> {
    return (tx ?? prisma).user.findUnique({ where: { email } });
  },

  findById(id: string, tx?: Tx): Promise<User | null> {
    return (tx ?? prisma).user.findUnique({ where: { id } });
  },

  /**
   * Admin directory: a page of users (optionally role-filtered/searched), newest
   * first, each with booking/charter/waybill counts. The counts come from a single
   * `_count` select (one query, no N+1) over the indexed FK relations.
   */
  async findAll(filter: UserListFilter, pagination: PaginationQuery): Promise<Page<AdminUserDTO>> {
    const where = buildUserWhere(filter);
    const [rows, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(pagination),
        select: {
          id: true, fullName: true, email: true, phone: true, role: true,
          operatorId: true, createdAt: true,
          _count: { select: { bookings: true, charters: true, waybills: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    const items: AdminUserDTO[] = rows.map((u) => ({
      id:         u.id,
      fullName:   u.fullName,
      email:      u.email,
      phone:      u.phone,
      role:       u.role,
      operatorId: u.operatorId,
      createdAt:  u.createdAt.toISOString(),
      counts:     { bookings: u._count.bookings, charters: u._count.charters, waybills: u._count.waybills },
    }));
    return { items, total };
  },

  create(data: Prisma.UserCreateInput, tx?: Tx): Promise<User> {
    return (tx ?? prisma).user.create({ data });
  },

  updateProfile(
    id: string,
    data: { fullName?: string; email?: string; phone?: string },
    tx?: Tx
  ): Promise<User> {
    return (tx ?? prisma).user.update({ where: { id }, data });
  },

  updatePassword(id: string, passwordHash: string, tx?: Tx): Promise<User> {
    return (tx ?? prisma).user.update({
      where: { id },
      data: { password: passwordHash },
    });
  },
};
