import StatCard from "@/components/ui/StatCard";

export const metadata = { title: "Analytics | Admin" };

const KPI = [
  { label: "Total Revenue",   value: "₦2,840,000", change: "+18%",  icon: "💰", color: "text-green-600",  bg: "bg-green-50"  },
  { label: "Total Bookings",  value: "1,204",       change: "+12%",  icon: "🎫", color: "text-blue-600",   bg: "bg-blue-50"   },
  { label: "Active Trips",    value: "38",          change: "+5",    icon: "🚌", color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Waybills Sent",   value: "329",         change: "+24%",  icon: "📦", color: "text-amber-600",  bg: "bg-amber-50"  },
  { label: "New Users",       value: "2,108",       change: "+9%",   icon: "👤", color: "text-teal-600",   bg: "bg-teal-50"   },
  { label: "Charter Requests",value: "47",          change: "+3",    icon: "🚐", color: "text-orange-600", bg: "bg-orange-50" },
];

const TOP_ROUTES = [
  { route: "Lagos → Abuja",         bookings: 412, revenue: "₦3,914,000", fill: "w-full"   },
  { route: "Lagos → Ibadan",        bookings: 287, revenue: "₦861,000",   fill: "w-10/12"  },
  { route: "Abuja → Port Harcourt", bookings: 198, revenue: "₦2,376,000", fill: "w-8/12"   },
  { route: "Lagos → Enugu",         bookings: 156, revenue: "₦1,716,000", fill: "w-7/12"   },
  { route: "Kano → Lagos",          bookings: 134, revenue: "₦2,010,000", fill: "w-5/12"   },
];

const MONTHS = ["Oct","Nov","Dec","Jan","Feb","Mar"];
const REVENUE_DATA = [580, 720, 840, 690, 910, 1050]; // in thousands

export default function AnalyticsPage() {
  const maxRevenue = Math.max(...REVENUE_DATA);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Last 30 days · March 2026</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {KPI.map((k) => (
            <StatCard key={k.label} icon={k.icon} label={k.label} value={k.value} bg={k.bg} color={k.color} change={`${k.change} this month`} />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Monthly Revenue (₦&apos;000)</h2>
            <div className="flex items-end gap-3 h-40">
              {REVENUE_DATA.map((val, i) => (
                <div key={MONTHS[i]} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-gray-500">{val}</p>
                  <div
                    className="w-full bg-blue-600 rounded-t-lg transition-all"
                    style={{ height: `${(val / maxRevenue) * 100}%`, minHeight: "4px" }}
                  />
                  <p className="text-xs text-gray-400">{MONTHS[i]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top routes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Top Routes</h2>
            <div className="space-y-4">
              {TOP_ROUTES.map((r) => (
                <div key={r.route}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{r.route}</span>
                    <span className="text-gray-400 text-xs">{r.bookings} bookings</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-blue-500 rounded-full ${r.fill}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Booking Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: "Bus Seats",    count: 892, pct: 74, color: "bg-blue-500"   },
                { label: "Waybills",     count: 329, pct: 27, color: "bg-green-500"  },
                { label: "Charters",     count: 47,  pct: 4,  color: "bg-amber-500"  },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="text-gray-500">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment methods */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Payment Methods</h2>
            <div className="space-y-3">
              {[
                { label: "Card",          pct: 58, color: "bg-blue-500"   },
                { label: "Bank Transfer", pct: 28, color: "bg-purple-500" },
                { label: "USSD",          pct: 14, color: "bg-teal-500"   },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28">{item.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-8 text-right">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
