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

export interface OperatorStats {
  totalBookings:  number;
  revenue:        number;
  activeTrips:    number;
  totalVehicles:  number;
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
    //
    // WAT is UTC+1 fixed (no DST). Subtracting an extra hour from the cutoff
    // ensures the window covers the full first WAT day even when the DB server
    // runs in UTC (a booking at 23:30 UTC = 00:30 WAT the next day must not be
    // cut off). AT TIME ZONE 'Africa/Lagos' groups by WAT calendar day.
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000 - 60 * 60 * 1000);
    const rows = await prisma.$queryRaw<Array<{ date: string; revenue: bigint }>>`
      SELECT
        DATE("createdAt" AT TIME ZONE 'Africa/Lagos')::text AS date,
        SUM("totalAmount")                                   AS revenue
      FROM bookings
      WHERE status = 'confirmed'
        AND "createdAt" >= ${cutoff}
      GROUP BY DATE("createdAt" AT TIME ZONE 'Africa/Lagos')
      ORDER BY DATE("createdAt" AT TIME ZONE 'Africa/Lagos') ASC
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

  async getOperatorStats(operatorId: string): Promise<OperatorStats> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [bookings, trips, vehicles] = await Promise.all([
      prisma.$queryRaw<[{ count: bigint; revenue: bigint | null }]>`
        SELECT COUNT(b.id)          AS count,
               SUM(b."totalAmount") AS revenue
        FROM bookings b
        JOIN trips t ON t.id = b."tripId"
        WHERE t."operatorId" = ${operatorId}
          AND b.status = 'confirmed'
          AND b."createdAt" >= ${cutoff}
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM trips
        WHERE "operatorId" = ${operatorId}
          AND status IN ('scheduled', 'active')
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM vehicles
        WHERE "operatorId" = ${operatorId}
          AND active = true
      `,
    ]);

    return {
      totalBookings: Number(bookings[0].count),
      revenue:       Number(bookings[0].revenue ?? 0),
      activeTrips:   Number(trips[0].count),
      totalVehicles: Number(vehicles[0].count),
    };
  },

  async getBookingsByOperator(limit = 20): Promise<OperatorStat[]> {
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
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      operator: r.operator,
      bookings: Number(r.bookings),
      revenue:  Number(r.revenue),
    }));
  },
};
