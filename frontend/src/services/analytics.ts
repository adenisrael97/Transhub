import api from "@/lib/api";

export interface AnalyticsSummary {
  totalRevenue:    number;
  totalBookings:   number;
  totalPassengers: number;
  activeTrips:     number;
}

export interface RevenuePoint {
  date:    string; // YYYY-MM-DD
  revenue: number;
}

export interface TopRoute {
  route:    string;
  bookings: number;
  revenue:  number;
}

export interface OperatorStat {
  operator: string;
  bookings: number;
  revenue:  number;
}

export const fetchSummary = (): Promise<AnalyticsSummary> =>
  api.get<AnalyticsSummary, AnalyticsSummary>("/analytics/summary");

export const fetchRevenue = (days = 30): Promise<RevenuePoint[]> =>
  api.get<RevenuePoint[], RevenuePoint[]>(`/analytics/revenue?days=${days}`);

export const fetchTopRoutes = (): Promise<TopRoute[]> =>
  api.get<TopRoute[], TopRoute[]>("/analytics/routes");

export const fetchOperatorStats = (): Promise<OperatorStat[]> =>
  api.get<OperatorStat[], OperatorStat[]>("/analytics/operators");

export interface MyOperatorStats {
  totalBookings: number;
  revenue:       number;
  activeTrips:   number;
  totalVehicles: number;
}

export const fetchMyStats = (): Promise<MyOperatorStats> =>
  api.get<MyOperatorStats, MyOperatorStats>("/analytics/operator");
