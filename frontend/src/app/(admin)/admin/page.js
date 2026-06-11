"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, Ticket, Bus, Users, Plus, Building2, Loader2, AlertCircle } from "lucide-react";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize, formatTime } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import { fetchSummary, fetchRevenue } from "@/services/analytics";
import { fetchBookings } from "@/services/bookings";

function fmtRevenue(n) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n}`;
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 animate-pulse">
      <div className="h-4 bg-[#F1F5F9] rounded w-1/2 mb-3" />
      <div className="h-8 bg-[#F1F5F9] rounded w-3/4" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchSummary(), fetchRevenue(6), fetchBookings()])
      .then(([s, r, b]) => {
        if (cancelled) return;
        setSummary(s);
        setRevenue(r);
        setBookings((b.bookings ?? []).slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load dashboard data. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const KPI = summary
    ? [
        { label: "Total Revenue",    value: fmtRevenue(summary.totalRevenue),        Icon: DollarSign, bg: "bg-green-50",  color: "text-green-600",  href: "/analytics"    },
        { label: "Total Bookings",   value: summary.totalBookings.toLocaleString(),   Icon: Ticket,     bg: "bg-blue-50",   color: "text-blue-600",   href: "/bookings"     },
        { label: "Active Trips",     value: summary.activeTrips.toLocaleString(),     Icon: Bus,        bg: "bg-blue-50", color: "text-[#0A1B3D]", href: "/manage-trips" },
        { label: "Total Passengers", value: summary.totalPassengers.toLocaleString(), Icon: Users,      bg: "bg-green-50",   color: "text-green-600",   href: "/analytics"    },
      ]
    : [];

  const maxRev = revenue.length ? Math.max(...revenue.map((r) => r.revenue)) : 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Admin Dashboard</h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link
            href="/manage-trips"
            className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={15} /> Add Trip
          </Link>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : KPI.map(({ Icon, label, value, bg, color, href }) => (
                <StatCard key={label} icon={<Icon size={22} />} label={label} value={value} bg={bg} color={color} hover href={href} valueSize="xl" />
              ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Manage Trips",  Icon: Bus,       href: "/manage-trips", cls: "bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]" },
            { label: "View Bookings", Icon: Ticket,    href: "/bookings",     cls: "bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7]" },
            { label: "Analytics",     Icon: DollarSign,href: "/analytics",    cls: "bg-[#F5F3FF] text-[#6D28D9] hover:bg-[#EDE9FE]" },
            { label: "Operators",     Icon: Building2, href: "/operators",    cls: "bg-[#EEF2FF] text-[#4338CA] hover:bg-[#E0E7FF]" },
          ].map(({ label, Icon, href, cls }) => (
            <Link key={label} href={href} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${cls}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue chart (last 6 confirmed bookings by day) */}
          <div className="th-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#0F172A]">Daily Revenue</h2>
              <span className="text-[11px] font-semibold text-[#475569] bg-[#F1F5F9] px-2 py-1 rounded-lg">Last 6 days</span>
            </div>
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-[#64748B]" />
              </div>
            ) : revenue.length === 0 || maxRev <= 0 ? (
              <div className="h-40 flex flex-col items-center justify-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <DollarSign size={18} className="text-[#2563EB]" />
                </div>
                <p className="text-sm font-medium text-[#64748B]">No revenue recorded yet</p>
              </div>
            ) : (
              <div className="flex items-stretch gap-2.5 h-40">
                {revenue.map((pt) => {
                  const pct = Math.round((pt.revenue / maxRev) * 100);
                  return (
                    <div key={pt.date} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-bold text-[#0F172A] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                        {pt.revenue > 0 ? fmtRevenue(pt.revenue) : ""}
                      </span>
                      <div className="relative w-full flex-1 bg-[#F1F5F9] rounded-lg flex items-end overflow-hidden" title={`₦${pt.revenue.toLocaleString()}`}>
                        <div
                          className="w-full bg-linear-to-t from-[#1D4ED8] to-[#3B82F6] rounded-lg transition-all group-hover:from-[#1E40AF] group-hover:to-[#2563EB]"
                          style={{ height: pt.revenue > 0 ? `${Math.max(pct, 3)}%` : "0%" }}
                        />
                      </div>
                      <p className="text-[10px] font-medium text-[#64748B] truncate w-full text-center">
                        {new Date(pt.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-[#64748B] mt-4 text-right">
              <Link href="/analytics" className="font-semibold text-[#2563EB] hover:underline transition-colors">View full analytics →</Link>
            </p>
          </div>

          {/* Recent bookings preview */}
          <div className="lg:col-span-2 th-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
              <h2 className="font-semibold text-[#0F172A]">Recent Bookings</h2>
              <Link href="/bookings" className="text-xs text-[#2563EB] font-semibold hover:underline">View all →</Link>
            </div>
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 size={22} className="animate-spin text-[#64748B]" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm font-medium text-[#64748B]">No bookings yet.</div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {bookings.map((b) => (
                  <div key={b.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
                        <Ticket size={16} className="text-[#2563EB]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0F172A] font-mono truncate">{b.paymentRef ?? b.id.slice(0, 8)}</p>
                        <p className="text-xs text-[#64748B]">
                          {b.seats.map((s) => s.label).join(", ")} · {formatTime(b.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-[#0F172A] tabular-nums">₦{b.totalAmount.toLocaleString()}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[b.status] ?? STATUS_BADGE.pending}`}>
                        {capitalize(b.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
