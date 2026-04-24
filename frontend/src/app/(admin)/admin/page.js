"use client";
import Link from "next/link";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize } from "@/lib/utils";
import useFleetStore from "@/store/fleetStore";
import StatCard from "@/components/ui/StatCard";

const KPI = [
  { label: "Total Revenue",    value: "₦2,840,000", change: "+18%", icon: "💰", color: "text-green-600",  bg: "bg-green-50",  href: "/analytics" },
  { label: "Total Bookings",   value: "1,204",       change: "+12%", icon: "🎫", color: "text-blue-600",   bg: "bg-blue-50",   href: "/bookings"  },
  { label: "Active Trips",     value: "38",          change: "+5",   icon: "🚌", color: "text-purple-600", bg: "bg-purple-50", href: "/manage-trips"     },
  { label: "Waybills Sent",    value: "329",         change: "+24%", icon: "📦", color: "text-amber-600",  bg: "bg-amber-50",  href: "/analytics" },
  { label: "New Users",        value: "2,108",       change: "+9%",  icon: "👤", color: "text-teal-600",   bg: "bg-teal-50",   href: "/analytics" },
  { label: "Charter Requests", value: "47",          change: "+3",   icon: "🚐", color: "text-orange-600", bg: "bg-orange-50", href: "/analytics" },
  { label: "Operator Requests",value: "4",           change: "+2",   icon: "🏢", color: "text-indigo-600",bg: "bg-indigo-50",href: "/operators" },
];

const RECENT_BOOKINGS = [
  { id: "BK-001", passenger: "Emeka Okafor",  route: "Lagos → Abuja",        amount: 9500,  status: "confirmed", time: "2 mins ago"  },
  { id: "BK-002", passenger: "Fatima Aliyu",  route: "Kano → Lagos",         amount: 15000, status: "confirmed", time: "8 mins ago"  },
  { id: "BK-003", passenger: "Tunde Balogun", route: "Abuja → Port Harcourt",amount: 12000, status: "pending",   time: "15 mins ago" },
  { id: "BK-004", passenger: "Chioma Eze",    route: "Lagos → Enugu",        amount: 11000, status: "completed", time: "1 hr ago"    },
  { id: "BK-005", passenger: "Ibrahim Musa",  route: "Kaduna → Abuja",       amount: 7500,  status: "cancelled", time: "2 hrs ago"   },
];

const QUICK_ACTIONS = [
  { label: "Add New Trip",      icon: "🚌", href: "/manage-trips",     color: "bg-blue-50   text-blue-700   hover:bg-blue-100"   },
  { label: "View Bookings",     icon: "🎫", href: "/bookings",  color: "bg-green-50  text-green-700  hover:bg-green-100"  },
  { label: "Analytics",         icon: "📊", href: "/analytics", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
  { label: "Waybill Tracking",  icon: "📦", href: "/track",     color: "bg-amber-50  text-amber-700  hover:bg-amber-100"  },
  { label: "Manage Operators", icon: "🏢", href: "/operators", color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
];

const MONTHS = ["Oct","Nov","Dec","Jan","Feb","Mar"];
const REVENUE = [580, 720, 840, 690, 910, 1050];
const maxRevenue = Math.max(...REVENUE);

export default function AdminDashboardPage() {
  const drivers = useFleetStore((state) => state.drivers);
  const getVisibleTrips = useFleetStore((state) => state.getVisibleTrips);
  const activeTrips = getVisibleTrips().map((trip) => ({
    id: trip.id,
    route: `${trip.from} → ${trip.to}`,
    dep: new Date(trip.departureTime).toLocaleTimeString("en-NG", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    booked: (trip.totalSeats ?? 0) - (trip.availableSeats ?? 0),
    seats: trip.totalSeats ?? 0,
    operator: trip.operator,
  }));
  const availableDrivers = drivers.filter((driver) => driver.isAvailable);

  const dashboardKpi = KPI.map((item) => {
    if (item.label === "Active Trips") {
      return { ...item, value: String(activeTrips.length), change: `${availableDrivers.length} drivers online` };
    }
    return item;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/manage-trips" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              + Add Trip
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          {dashboardKpi.map((k) => (
            <StatCard key={k.label} icon={k.icon} label={k.label} value={k.value} bg={k.bg} color={k.color} change={k.change} hover href={k.href} valueSize="xl" />
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.label} href={a.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${a.color}`}>
              <span className="text-xl">{a.icon}</span>
              {a.label}
            </Link>
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
                    className="w-full bg-blue-600 rounded-t-md transition-all"
                    style={{ height: `${(val / maxRevenue) * 100}%`, minHeight: "4px" }}
                  />
                  <p className="text-xs text-gray-400">{MONTHS[i]}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-right">
              <Link href="/analytics" className="hover:text-blue-600 transition-colors">View full analytics →</Link>
            </p>
          </div>

          {/* Active trips */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Active Trips Today</h2>
              <Link href="/manage-trips" className="text-xs text-blue-600 font-semibold hover:underline">View all</Link>
            </div>
            {activeTrips.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {activeTrips.map((trip) => {
                  const fillPct = trip.seats > 0 ? Math.round((trip.booked / trip.seats) * 100) : 0;
                  return (
                    <div key={trip.id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{trip.route}</p>
                          <p className="text-xs text-gray-400">{trip.operator} · Departs {trip.dep} · Driver available</p>
                        </div>
                        <span className="text-sm font-bold text-blue-600">{trip.booked}/{trip.seats}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-red-500" : fillPct >= 60 ? "bg-amber-500" : "bg-green-500"}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-8 text-sm text-gray-500">
                No active trips are visible right now. Drivers are currently offline.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Driver Availability</h2>
            <p className="text-xs text-gray-400">
              {availableDrivers.length} of {drivers.length} online · {activeTrips.length} trips visible
            </p>
          </div>

          {/* Summary counters */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3">
              <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Online</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{availableDrivers.length}</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Offline</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{drivers.length - availableDrivers.length}</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Visible Trips</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{activeTrips.length}</p>
            </div>
          </div>

          {/* Individual driver rows */}
          <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
            {drivers.map((driver) => (
              <div key={driver.id} className="flex items-center justify-between px-4 py-3 bg-white">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${driver.isAvailable ? "bg-green-500" : "bg-gray-300"}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{driver.name}</p>
                    <p className="text-xs text-gray-400">{driver.vehicleLabel} · {driver.operator}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  driver.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {driver.isAvailable ? "Available" : "Offline"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
            <Link href="/bookings" className="text-xs text-blue-600 font-semibold hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-50">
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Passenger</th>
                  <th className="px-6 py-3">Route</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {RECENT_BOOKINGS.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{b.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{b.passenger}</td>
                    <td className="px-6 py-4 text-gray-600">{b.route}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">₦{b.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[b.status]}`}>
                        {capitalize(b.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">{b.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
