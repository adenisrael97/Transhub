/**
 * Transactions business logic: assemble the paginated financial feed and enforce
 * the operator scope. Operators only ever see their own transactions (their
 * trips' bookings + waybills assigned to them); the operator scope is forced from
 * the JWT so a client-supplied operatorId can't widen it.
 */
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import { transactionsRepository, type TransactionDTO, type TransactionFilter } from "./transactions.repository";

export const transactionsService = {
  async list(
    filter: TransactionFilter,
    requester: { id: string; role: string; operatorId?: string },
    pagination: PaginationQuery
  ): Promise<{ transactions: TransactionDTO[]; pagination: PageMeta }> {
    // Hard-scope by role (overriding any client-supplied filter):
    //  - operator  → their own operatorId (trips' bookings + assigned waybills)
    //  - passenger → their own userId (their personal payment history)
    //  - admin     → unrestricted (may still filter by ?operatorId)
    let scoped: TransactionFilter = filter;
    if (requester.role === "operator") scoped = { ...filter, operatorId: requester.operatorId };
    else if (requester.role === "passenger") scoped = { ...filter, userId: requester.id, operatorId: undefined };

    const { items, total } = await transactionsRepository.findAll(scoped, pagination);
    return { transactions: items, pagination: pageMeta(total, pagination) };
  },
};
