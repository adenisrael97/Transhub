/**
 * Users data access — the ONLY place that touches the `users` table.
 * (Table-ownership rule: the users module owns this table; other modules
 * must go through users' public interface, never query users directly.)
 *
 * All mutating methods accept an optional Prisma transaction client (`tx`)
 * so callers that span multiple tables can include user writes in a single
 * atomic transaction without bypassing the repository layer.
 */
import type { Prisma, User } from "@prisma/client";
import { prisma } from "../../infra/db/client";

type Tx = Prisma.TransactionClient;

export const usersRepository = {
  findByEmail(email: string, tx?: Tx): Promise<User | null> {
    return (tx ?? prisma).user.findUnique({ where: { email } });
  },

  findById(id: string, tx?: Tx): Promise<User | null> {
    return (tx ?? prisma).user.findUnique({ where: { id } });
  },

  create(data: Prisma.UserCreateInput, tx?: Tx): Promise<User> {
    return (tx ?? prisma).user.create({ data });
  },
};
