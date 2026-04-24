"use client";
import useFleetStore from "@/store/fleetStore";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import { capitalize } from "@/lib/utils";

const STATS = [
  { label: "Trips Today",    value: "3",    icon: "🚌", color: "text-blue-600",  bg: "bg-blue-50"  },
  { label: "Earnings Today", value: "₦45,000", icon: "💰", color: "text-green-600", bg: "bg-green-50" },
  { label: "Rating",         value: "4.8 ⭐", icon: "⭐", color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Total Trips",    value: "312",  icon: "📍", color: "text-purple-600", bg: "bg-purple-50" },
];

const DRIVER_ID = "DRV-001";

function formatTripDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
  });
}

function formatTripTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function DriverDashboardPage() {
  const driver = useFleetStore((state) => state.getDriver(DRIVER_ID));
  const trips = useFleetStore((state) => state.trips);
  const setDriverAvailability = useFleetStore((state) => state.setDriverAvailability);

  const online = driver?.isAvailable ?? false;
  const upcomingTrips = trips.filter((trip) => trip.driverId === DRIVER_ID);

  if (!driver) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4">
        <div className="bg-white border border-red-100 text-red-700 rounded-2xl p-6 max-w-md w-full">
          <p className="font-semibold mb-1">Driver profile not found</p>
          <p className="text-sm">Please refresh the page. If this persists, contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome back, {driver.name.split(" ")[0]} 👋</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 min-w-65">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Availability</p>
              <p className={`text-sm font-semibold ${online ? "text-green-700" : "text-gray-500"}`}>
                {online ? "Available for trips" : "Not available for trips"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={online}
              onClick={() => setDriverAvailability(DRIVER_ID, !online)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                online ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span className="sr-only">Toggle driver availability</span>
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  online ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className={`mb-8 rounded-2xl border px-4 py-3 text-sm ${online ? "bg-green-50 border-green-200 text-green-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
          {online
            ? "You are visible to passengers and admins. Your assigned bus can receive trip bookings."
            : "You are hidden from passenger search and admin active-trip board until you switch back online."}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} bg={s.bg} color={s.color} />
          ))}
        </div>

        {/* Upcoming trips */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Upcoming Trips</h2>
            <span className="text-xs text-gray-400">{upcomingTrips.length} scheduled</span>
          </div>
          {upcomingTrips.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {upcomingTrips.map((trip) => (
                <div key={trip.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-sm font-bold text-blue-600">
                      {new Date(trip.departureTime).getHours()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{trip.from} → {trip.to}</p>
                      <p className="text-xs text-gray-400">
                        {formatTripDate(trip.departureTime)} · {formatTripTime(trip.departureTime)} · {trip.availableSeats} seats left
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${online ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {capitalize(online ? "available" : "offline")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-gray-400">
              No upcoming trips assigned yet. Check back later.
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <Button variant="secondary" fullWidth>📋 View Manifest</Button>
          <Button variant="secondary" fullWidth>💬 Contact Support</Button>
          <Button variant="secondary" fullWidth>📊 Earnings History</Button>
        </div>
      </div>
    </div>
  );
}
