/**
 * Transactions read model — a read-only financial feed.
 *
 * Owns NO tables. Like the analytics module, it runs cross-module SELECTs via
 * raw SQL and never writes. There is deliberately no `payments` table at this
 * scale (see CLAUDE.md "avoid over-engineering"); a transaction is any record
 * that carries a Paystack paymentRef — a confirmed/settling booking, charter, or
 * waybill. This UNION ALL projects all three into one shape so the admin
 * Payments/Transactions views and the operator Transactions view share one
 * paginated, filterable, searchable query.
 *
 * Pagination/filtering happen in SQL (LIMIT/OFFSET + WHERE on the union), so the
 * feed scales without materialising every row in the app.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";
import { toDateRange, toNumberRange } from "../../shared/list-query";

export interface TransactionDTO {
  reference:     string;
  type:          "booking" | "charter" | "waybill";
  amount:        number;  // naira
  status:        string;
  customerName:  string;
  customerEmail: string | null;
  description:   string;  // route, e.g. "Lagos → Abuja"
  relatedId:     string;  // booking/charter/waybill id
  operatorId:    string | null;
  createdAt:     string;  // ISO
}

export interface TransactionFilter {
  type?:       "booking" | "charter" | "waybill";
  status?:     string;
  operatorId?: string;     // when set, scope to this operator (admin filter OR operator scope)
  userId?:     string;     // when set, scope to this customer (their own payment history)
  minAmount?:  number;
  maxAmount?:  number;
  dateFrom?:   string;
  dateTo?:     string;
  search?:     string;
}

interface RawRow {
  reference:      string;
  type:           "booking" | "charter" | "waybill";
  amount:         number;
  status:         string;
  customer_name:  string;
  customer_email: string | null;
  description:    string;
  related_id:     string;
  operator_id:    string | null;
  user_id:        string;
  created_at:     Date;
}

// The unified projection. paymentRef-bearing rows only. amount → float8 (naira
// values are exactly representable; avoids Decimal/string round-tripping).
const UNION = Prisma.sql`
  SELECT b."paymentRef" AS reference, 'booking'::text AS type,
         b."totalAmount"::float8 AS amount, b.status::text AS status,
         b."createdAt" AS created_at, b.id::text AS related_id,
         u."fullName" AS customer_name, u.email AS customer_email,
         COALESCE(t."from" || ' → ' || t."to", 'Trip booking') AS description,
         t."operatorId"::text AS operator_id, b."userId"::text AS user_id
  FROM bookings b
  JOIN users u ON u.id = b."userId"
  LEFT JOIN trips t ON t.id = b."tripId"
  WHERE b."paymentRef" IS NOT NULL
  UNION ALL
  SELECT c."paymentRef", 'charter'::text,
         COALESCE(c."paidAmount", c."quotedPrice", 0)::float8, c.status::text,
         c."createdAt", c.id::text,
         u."fullName", u.email,
         c."fromLocation" || ' → ' || c."toLocation",
         NULL::text, c."passengerId"::text
  FROM charters c
  JOIN users u ON u.id = c."passengerId"
  WHERE c."paymentRef" IS NOT NULL
  UNION ALL
  SELECT w."paymentRef", 'waybill'::text,
         w.fee::float8, w.status::text,
         w."createdAt", w.id::text,
         u."fullName", u.email,
         w."fromLocation" || ' → ' || w."toLocation",
         w."assignedOperatorId"::text, w."userId"::text
  FROM waybills w
  JOIN users u ON u.id = w."userId"
  WHERE w."paymentRef" IS NOT NULL
`;

function buildConditions(filter: TransactionFilter): Prisma.Sql {
  const conds: Prisma.Sql[] = [];
  if (filter.type)       conds.push(Prisma.sql`type = ${filter.type}`);
  if (filter.status)     conds.push(Prisma.sql`status = ${filter.status}`);
  // operator_id is NULL for charters, so `= ${op}` correctly excludes them when
  // an operator (or an operator-scoped admin filter) is applied.
  if (filter.operatorId) conds.push(Prisma.sql`operator_id = ${filter.operatorId}`);
  if (filter.userId)     conds.push(Prisma.sql`user_id = ${filter.userId}`);

  const amount = toNumberRange(filter.minAmount, filter.maxAmount);
  if (amount?.gte != null) conds.push(Prisma.sql`amount >= ${amount.gte}`);
  if (amount?.lte != null) conds.push(Prisma.sql`amount <= ${amount.lte}`);

  const created = toDateRange(filter.dateFrom, filter.dateTo);
  if (created?.gte) conds.push(Prisma.sql`created_at >= ${created.gte}`);
  if (created?.lte) conds.push(Prisma.sql`created_at <= ${created.lte}`);

  if (filter.search) {
    const q = `%${filter.search}%`;
    conds.push(
      Prisma.sql`(reference ILIKE ${q} OR customer_name ILIKE ${q} OR customer_email ILIKE ${q} OR description ILIKE ${q})`
    );
  }
  return conds.length ? Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}` : Prisma.empty;
}

export const transactionsRepository = {
  async findAll(filter: TransactionFilter, pagination: PaginationQuery): Promise<Page<TransactionDTO>> {
    const where = buildConditions(filter);
    const { skip, take } = toSkipTake(pagination);

    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw<RawRow[]>(Prisma.sql`
        SELECT * FROM ( ${UNION} ) txns
        ${where}
        ORDER BY created_at DESC
        LIMIT ${take} OFFSET ${skip}
      `),
      prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count FROM ( ${UNION} ) txns ${where}
      `),
    ]);

    const items: TransactionDTO[] = rows.map((r) => ({
      reference:     r.reference,
      type:          r.type,
      amount:        Number(r.amount),
      status:        r.status,
      customerName:  r.customer_name,
      customerEmail: r.customer_email,
      description:   r.description,
      relatedId:     r.related_id,
      operatorId:    r.operator_id,
      createdAt:     r.created_at.toISOString(),
    }));
    return { items, total: Number(countRows[0].count) };
  },
};
