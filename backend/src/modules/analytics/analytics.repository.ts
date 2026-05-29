/**
 * Analytics read-only aggregates.
 * Owns no tables — runs cross-module SELECTs via raw SQL.
 * Never writes to the DB.
 */
import { prisma } from "../../infra/db/client";

export interface AnalyticsSummary {
  totalRevenue:    number;
  totalBookings:   number;
  totalPassengers: number;
  activeTrips:     number;
}

export interface RevenueByDay {
  date:    string; // YYYY-MM-DD
  revenue: number; // naira
}

export interface TopRoute {
  route:    string; // "Lagos → Abuja"
  bookings: number;
  revenue:  number;
}

export interface OperatorStat {
  operator: string;
  bookings: number;
  revenue:  number;
}

export const analyticsRepository = {
  async getSummary(): Promise<AnalyticsSummary> {
    // COUNT/SUM over an int column come back from Prisma raw queries as bigint
    // (NULL for SUM when there are no rows). Number() narrows safely; naira
    // totals stay well within Number.MAX_SAFE_INTEGER.
    const [revenue, bookings, passengers, trips] = await Promise.all([
      prisma.$queryRaw<[{ total: bigint | null }]>`
        SELECT SUM("totalAmount") AS total
        FROM bookings
        WHERE status = 'confirmed'
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM bookings
        WHERE status = 'confirmed'
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "userId") AS count
        FROM bookings
        WHERE status = 'confirmed'
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM trips
        WHERE status IN ('scheduled', 'active')
      `,
    ]);

    return {
      totalRevenue:    Number(revenue[0].total ?? 0),
      totalBookings:   Number(bookings[0].count),
      totalPassengers: Number(passengers[0].count),
      activeTrips:     Number(trips[0].count),
    };
  },

  async getRevenueByDay(days = 30): Promise<RevenueByDay[]> {
    // Bind a concrete cutoff timestamp rather than building an interval from a
    // bound parameter inside SQL ($1 * INTERVAL is ambiguous to the planner).
    // Cast the grouped date to text in SQL so we never round-trip through a JS
    // Date (which would shift the day under any non-UTC server/locale).
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await prisma.$queryRaw<Array<{ date: string; revenue: bigint }>>`
      SELECT
        DATE("createdAt")::text AS date,
        SUM("totalAmount")      AS revenue
      FROM bookings
      WHERE status = 'confirmed'
        AND "createdAt" >= ${cutoff}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `;
    return rows.map((r) => ({
      date:    r.date,
      revenue: Number(r.revenue),
    }));
  },

  async getTopRoutes(limit = 5): Promise<TopRoute[]> {
    const rows = await prisma.$queryRaw<
      Array<{ route: string; bookings: bigint; revenue: bigint }>
    >`
      SELECT
        t."from" || ' → ' || t."to"  AS route,
        COUNT(b.id)                   AS bookings,
        SUM(b."totalAmount")          AS revenue
      FROM bookings b
      JOIN trips t ON t.id = b."tripId"
      WHERE b.status = 'confirmed'
      GROUP BY t."from", t."to"
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      route:    r.route,
      bookings: Number(r.bookings),
      revenue:  Number(r.revenue),
    }));
  },

  async getBookingsByOperator(): Promise<OperatorStat[]> {
    const rows = await prisma.$queryRaw<
      Array<{ operator: string; bookings: bigint; revenue: bigint }>
    >`
      SELECT
        o."companyName"      AS operator,
        COUNT(b.id)          AS bookings,
        SUM(b."totalAmount") AS revenue
      FROM bookings b
      JOIN trips     t ON t.id  = b."tripId"
      JOIN operators o ON o.id  = t."operatorId"
      WHERE b.status = 'confirmed'
      GROUP BY o."companyName"
      ORDER BY revenue DESC
    `;
    return rows.map((r) => ({
      operator: r.operator,
      bookings: Number(r.bookings),
      revenue:  Number(r.revenue),
    }));
  },
};
