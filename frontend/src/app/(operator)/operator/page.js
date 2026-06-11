"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, Bus, Ticket, Truck, TrendingUp, Star, Plus, Settings } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { SkeletonStatCard } from "@/components/ui/Skeleton";
import { capitalize } from "@/lib/utils";
import { fetchMyStats } from "@/services/analytics";

const TRIPS_TODAY = [
  { id: "TR-101", route: "Lagos → Abuja",        dep: "6:00 AM",  booked: 16, seats: 18, status: "in-transit" },
  { id: "TR-102", route: "Enugu → Lagos",         dep: "7:30 AM",  booked: 30, seats: 33, status: "in-transit" },
  { id: "TR-103", route: "Lagos → Owerri",        dep: "9:00 AM",  booked: 14, seats: 18, status: "boarding"   },
  { id: "TR-104", route: "Abuja → Port Harcourt", dep: "11:00 AM", booked: 8,  seats: 18, status: "scheduled"  },
  { id: "TR-105", route: "Enugu → Abuja",         dep: "1:00 PM",  booked: 22, seats: 33, status: "scheduled"  },
];

const RECENT_BOOKINGS = [
  { id: "BK-401", passenger: "Ada Eze",        route: "Lagos → Abuja",  amount: 12000, time: "3 mins ago"  },
  { id: "BK-402", passenger: "Musa Abdullahi", route: "Enugu → Lagos",  amount: 9500,  time: "8 mins ago"  },
  { id: "BK-403", passenger: "Ngozi Okafor",   route: "Lagos → Owerri", amount: 8000,  time: "15 mins ago" },
  { id: "BK-404", passenger: "Emeka Chukwu",   route: "Enugu → Abuja",  amount: 11000, time: "22 mins ago" },
  { id: "BK-405", passenger: "Fatima Bello",   route: "Lagos → Abuja",  amount: 12000, time: "35 mins ago" },
];

const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const REVENUE = [1200, 1450, 1800, 1550, 1900, 2400];
const maxRev  = Math.max(...REVENUE);

const STATUS_COLOR = {
  "in-transit": "bg-[#EFF6FF] text-[#1D4ED8]",
  boarding:     "bg-[#FFFBEB] text-[#B45309]",
  scheduled:    "bg-[#F1F5F9] text-[#475569]",
  completed:    "bg-[#F1F5F9] text-[#475569]",
};

function fmtCurrency(n) {
  return `₦${n.toLocaleString()}`;
}

export default function OperatorDashboardPage() {
  const [stats, setStats]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchMyStats()
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const kpiCards = [
    {
      label: "Revenue (30d)",
      value: fmtCurrency(stats?.revenue ?? 0),
      Icon: DollarSign,
      bg: "bg-green-50",   color: "text-green-600",
    },
    {
      label: "Active Trips",
      value: String(stats?.activeTrips ?? 0),
      Icon: Bus,
      bg: "bg-blue-50",    color: "text-blue-600",
    },
    {
      label: "Bookings (30d)",
      value: String(stats?.totalBookings ?? 0),
      Icon: Ticket,
      bg: "bg-blue-50",  color: "text-[#0A1B3D]",
    },
    {
      label: "Fleet Vehicles",
      value: String(stats?.totalVehicles ?? 0),
      Icon: Truck,
      bg: "bg-amber-50",   color: "text-amber-600",
    },
    {
      label: "Avg Occupancy",
      value: "—",
      Icon: TrendingUp,
      bg: "bg-green-50",    color: "text-green-600",
    },
    {
      label: "Rating",
      value: "—",
      Icon: Star,
      bg: "bg-orange-50",  color: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Operator Dashboard</h1>
            <p className="text-sm text-[#64748B] mt-0.5 flex items-center gap-2">
              Last 30 days
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#15803D]">
                {capitalize("approved")}
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/operator/trips" className="flex items-center gap-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <Plus size={15} /> Add Trip
            </Link>
            <Link href="/operator/fleet" className="flex items-center gap-1.5 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <Settings size={15} /> Manage Fleet
            </Link>
          </div>
        </div>

        {/* KPI cards — animated skeleton during API fetch, real values after */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statsLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />)
            : kpiCards.map(({ Icon, label, value, bg, color }) => (
                <StatCard key={label} icon={<Icon size={22} />} label={label} value={value} bg={bg} color={color} hover />
              ))
          }
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue chart */}
          <div className="th-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#0F172A]">Revenue</h2>
              <span className="text-[11px] font-semibold text-[#475569] bg-[#F1F5F9] px-2 py-1 rounded-lg">₦&apos;000</span>
            </div>
            <div className="flex items-stretch gap-2.5 h-40">
              {REVENUE.map((val, i) => {
                const pct = Math.round((val / maxRev) * 100);
                return (
                  <div key={MONTHS[i]} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold text-[#0F172A] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                    <div className="relative w-full flex-1 bg-[#F1F5F9] rounded-lg flex items-end overflow-hidden">
                      <div className="w-full bg-linear-to-t from-[#15803D] to-[#22C55E] rounded-lg transition-all" style={{ height: `${Math.max(pct, 3)}%` }} />
                    </div>
                    <p className="text-xs font-medium text-[#64748B]">{MONTHS[i]}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's trips */}
          <div className="lg:col-span-2 th-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
              <h2 className="font-semibold text-[#0F172A]">Today&apos;s Trips</h2>
              <Link href="/operator/trips" className="text-xs text-[#15803D] font-semibold hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {TRIPS_TODAY.map((trip) => {
                const fillPct = Math.round((trip.booked / trip.seats) * 100);
                return (
                  <div key={trip.id} className="px-6 py-4 hover:bg-[#F8FAFC] transition-colors">
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <p className="font-semibold text-sm text-[#0F172A]">{trip.route}</p>
                        <p className="text-xs text-[#64748B]">{trip.id} · Departs {trip.dep}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[trip.status]}`}>
                          {trip.status === "in-transit" ? "In Transit" : capitalize(trip.status)}
                        </span>
                        <span className="text-sm font-bold text-[#0F172A] tabular-nums">{trip.booked}/{trip.seats}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-[#DC2626]" : fillPct >= 60 ? "bg-[#D97706]" : "bg-[#16A34A]"}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="th-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
            <h2 className="font-semibold text-[#0F172A]">Recent Bookings</h2>
            <Link href="/operator/bookings" className="text-xs text-[#15803D] font-semibold hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#64748B] font-bold uppercase tracking-wider border-b border-[#F1F5F9] bg-[#F8FAFC]">
                  {["ID", "Passenger", "Route", "Amount", "Time"].map((h) => (
                    <th key={h} className="px-6 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {RECENT_BOOKINGS.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-[#64748B]">{b.id}</td>
                    <td className="px-6 py-4 font-semibold text-[#0F172A]">{b.passenger}</td>
                    <td className="px-6 py-4 text-[#475569]">{b.route}</td>
                    <td className="px-6 py-4 font-bold text-[#0F172A] tabular-nums">₦{b.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-[#64748B]">{b.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {[
            { label: "Add Trip",      Icon: Plus,    href: "/operator/trips",    cls: "bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7]" },
            { label: "View Bookings", Icon: Ticket,  href: "/operator/bookings", cls: "bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]" },
            { label: "Manage Fleet",  Icon: Bus,     href: "/operator/fleet",    cls: "bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7]" },
            { label: "Edit Profile",  Icon: Settings, href: "/operator/profile",  cls: "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]" },
          ].map(({ label, Icon, href, cls }) => (
            <Link key={label} href={href} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${cls}`}>
              <Icon size={17} /> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
