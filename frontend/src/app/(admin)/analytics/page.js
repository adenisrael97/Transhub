"use client";
import { useState, useEffect } from "react";
import { DollarSign, Ticket, Bus, Users } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import {
  fetchSummary,
  fetchRevenue,
  fetchTopRoutes,
} from "@/services/analytics";

function fmtRevenue(n) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n}`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

// ── Skeletons ──────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 animate-pulse">
      <div className="h-4 bg-[#F1F5F9] rounded w-1/2 mb-3" />
      <div className="h-8 bg-[#F1F5F9] rounded w-3/4" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 animate-pulse">
      <div className="h-4 bg-[#F1F5F9] rounded w-40 mb-6" />
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-[#F1F5F9] rounded-t-lg"
            style={{ height: `${30 + (i % 3) * 25}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [summary,  setSummary]  = useState(null);
  const [revenue,  setRevenue]  = useState([]);
  const [routes,   setRoutes]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchSummary(), fetchRevenue(30), fetchTopRoutes()])
      .then(([s, r, rt]) => {
        if (cancelled) return;
        setSummary(s);
        setRevenue(r);
        setRoutes(rt);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load analytics data. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const maxRevenue = revenue.length ? Math.max(...revenue.map((r) => r.revenue)) : 1;
  const maxBookings = routes.length ? Math.max(...routes.map((r) => r.bookings)) : 1;

  const KPI = summary
    ? [
        { label: "Total Revenue",    value: fmtRevenue(summary.totalRevenue),              Icon: DollarSign, bg: "bg-green-50",  color: "text-green-600"  },
        { label: "Total Bookings",   value: summary.totalBookings.toLocaleString(),         Icon: Ticket,     bg: "bg-blue-50",   color: "text-blue-600"   },
        { label: "Total Passengers", value: summary.totalPassengers.toLocaleString(),       Icon: Users,      bg: "bg-green-50",   color: "text-green-600"   },
        { label: "Active Trips",     value: summary.activeTrips.toLocaleString(),           Icon: Bus,        bg: "bg-blue-50", color: "text-[#0A1B3D]" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">Analytics</h1>
          <p className="text-sm text-[#64748B]">Last 30 days</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {KPI.map(({ Icon, label, value, bg, color }) => (
              <StatCard key={label} icon={<Icon size={22} />} label={label} value={value} bg={bg} color={color} />
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue chart */}
          {loading ? <ChartSkeleton /> : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <h2 className="font-semibold text-[#0F172A] mb-6">Daily Revenue (₦) — last 30 days</h2>
              {revenue.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-[#94A3B8]">
                  No confirmed bookings in this period
                </div>
              ) : (
                <div className="flex items-end gap-1.5 h-40 overflow-x-auto">
                  {revenue.map((pt) => (
                    <div key={pt.date} className="flex-1 min-w-4.5 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-[#2563EB] rounded-t-lg"
                        style={{ height: `${(pt.revenue / maxRevenue) * 100}%`, minHeight: "4px" }}
                        title={`${fmtDate(pt.date)}: ₦${pt.revenue.toLocaleString()}`}
                      />
                      <p className="text-[10px] text-[#94A3B8] rotate-45 origin-left whitespace-nowrap">
                        {fmtDate(pt.date)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Top routes */}
          {loading ? <ChartSkeleton /> : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <h2 className="font-semibold text-[#0F172A] mb-6">Top Routes</h2>
              {routes.length === 0 ? (
                <div className="text-sm text-[#94A3B8]">No confirmed bookings yet</div>
              ) : (
                <div className="space-y-4">
                  {routes.map((r) => (
                    <div key={r.route}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium text-[#475569]">{r.route}</span>
                        <span className="text-xs text-[#94A3B8]">{r.bookings} bookings</span>
                      </div>
                      <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB] rounded-full"
                          style={{ width: `${(r.bookings / maxBookings) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Booking breakdown — static breakdown by type (no API endpoint yet) */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-semibold text-[#0F172A] mb-4">Booking Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: "Bus Seats", count: 892, pct: 74, color: "#2563EB" },
                { label: "Waybills",  count: 329, pct: 27, color: "#16A34A" },
                { label: "Charters",  count: 47,  pct: 4,  color: "#D97706" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#475569]">{item.label}</span>
                    <span className="text-[#64748B]">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment methods — static (no API endpoint yet) */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-semibold text-[#0F172A] mb-4">Payment Methods</h2>
            <div className="space-y-3">
              {[
                { label: "Card",          pct: 58, color: "#2563EB" },
                { label: "Bank Transfer", pct: 28, color: "#7C3AED" },
                { label: "USSD",          pct: 14, color: "#0D9488" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-[#64748B] w-28">{item.label}</span>
                  <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                  </div>
                  <span className="text-sm font-semibold text-[#475569] w-8 text-right">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
