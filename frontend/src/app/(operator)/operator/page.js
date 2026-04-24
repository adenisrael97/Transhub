"use client";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import { capitalize } from "@/lib/utils";

/* ── Demo data ────────────────────────────────────────────────── */
const OPERATOR = {
  companyName: "Peace Mass Transit",
  contactName: "Obiora Nwankwo",
  status: "approved",
  city: "Enugu",
  fleetSize: "120+",
};

const KPI = [
  { label: "Today's Revenue",  value: "₦485,000",  change: "+22%", icon: "💰", color: "text-green-600",  bg: "bg-green-50"  },
  { label: "Active Trips",     value: "8",          change: "+2",   icon: "🚌", color: "text-blue-600",   bg: "bg-blue-50"   },
  { label: "Today's Bookings", value: "142",        change: "+18%", icon: "🎫", color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Fleet Vehicles",   value: "124",        change: "+4",   icon: "🚐", color: "text-amber-600",  bg: "bg-amber-50"  },
  { label: "Avg Occupancy",    value: "87%",        change: "+5%",  icon: "📈", color: "text-teal-600",   bg: "bg-teal-50"   },
  { label: "Rating",           value: "4.7★",       change: "+0.1", icon: "⭐", color: "text-orange-600", bg: "bg-orange-50" },
];

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
const maxRev = Math.max(...REVENUE);

const STATUS_COLOR = {
  "in-transit": "bg-blue-100 text-blue-700",
  boarding:     "bg-amber-100 text-amber-700",
  scheduled:    "bg-gray-100 text-gray-600",
  completed:    "bg-gray-100 text-gray-500",
};

export default function OperatorDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {OPERATOR.contactName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {OPERATOR.companyName} · {OPERATOR.city} ·{" "}
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                {capitalize(OPERATOR.status)}
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/operator/trips"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              + Add Trip
            </Link>
            <Link
              href="/operator/fleet"
              className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Manage Fleet
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {KPI.map((k) => (
            <StatCard key={k.label} icon={k.icon} label={k.label} value={k.value} bg={k.bg} color={k.color} change={k.change} hover valueSize="xl" />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Revenue (₦&apos;000)</h2>
            <div className="flex items-end gap-2 h-32">
              {REVENUE.map((val, i) => (
                <div key={MONTHS[i]} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-green-600 rounded-t-md transition-all"
                    style={{ height: `${(val / maxRev) * 100}%`, minHeight: "4px" }}
                  />
                  <p className="text-xs text-gray-400">{MONTHS[i]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Today's trips */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Today&apos;s Trips</h2>
              <Link href="/operator/trips" className="text-xs text-green-600 font-semibold hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {TRIPS_TODAY.map((trip) => {
                const fillPct = Math.round((trip.booked / trip.seats) * 100);
                return (
                  <div key={trip.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{trip.route}</p>
                        <p className="text-xs text-gray-400">
                          {trip.id} · Departs {trip.dep}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[trip.status]}`}>
                          {trip.status === "in-transit" ? "In Transit" : capitalize(trip.status)}
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {trip.booked}/{trip.seats}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          fillPct >= 90 ? "bg-red-500" : fillPct >= 60 ? "bg-amber-500" : "bg-green-500"
                        }`}
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
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
            <Link href="/operator/bookings" className="text-xs text-green-600 font-semibold hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-50">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Passenger</th>
                  <th className="px-6 py-3">Route</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {RECENT_BOOKINGS.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{b.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{b.passenger}</td>
                    <td className="px-6 py-4 text-gray-600">{b.route}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">₦{b.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">{b.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {[
            { label: "Add Trip",       icon: "🚌", href: "/operator/trips",    color: "bg-green-50 text-green-700 hover:bg-green-100" },
            { label: "View Bookings",  icon: "🎫", href: "/operator/bookings", color: "bg-blue-50 text-blue-700 hover:bg-blue-100"    },
            { label: "Manage Fleet",   icon: "🚐", href: "/operator/fleet",    color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
            { label: "Edit Profile",   icon: "👤", href: "/operator/profile",  color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${a.color}`}
            >
              <span className="text-xl">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
