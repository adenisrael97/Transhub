"use client";
import { capitalize } from "@/lib/utils";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";

const VEHICLES = [
  { id: "PMT-012", type: "Bus",        seats: 18, plate: "ENU-234-AB", status: "active",      driver: "Ifeanyi Eze",     lastService: "2026-03-10", mileage: "142,000 km" },
  { id: "PMT-045", type: "Luxury Bus", seats: 33, plate: "LAG-891-CD", status: "active",      driver: "Suleiman Bako",   lastService: "2026-03-05", mileage: "98,000 km"  },
  { id: "PMT-008", type: "Bus",        seats: 18, plate: "ENU-567-EF", status: "active",      driver: "Chukwudi Okoro",  lastService: "2026-02-28", mileage: "165,000 km" },
  { id: "PMT-021", type: "Bus",        seats: 18, plate: "ABJ-123-GH", status: "active",      driver: "Mohammed Yusuf",  lastService: "2026-03-15", mileage: "89,000 km"  },
  { id: "PMT-033", type: "Luxury Bus", seats: 33, plate: "ENU-456-IJ", status: "active",      driver: "Obi Nnamdi",      lastService: "2026-03-01", mileage: "112,000 km" },
  { id: "PMT-019", type: "Coaster",    seats: 22, plate: "LAG-789-KL", status: "maintenance", driver: "—",               lastService: "2026-03-20", mileage: "201,000 km" },
  { id: "PMT-027", type: "Bus",        seats: 18, plate: "PH-345-MN",  status: "inactive",    driver: "—",               lastService: "2026-01-15", mileage: "250,000 km" },
];

const STATUS_COLOR = {
  active:      "bg-green-100 text-green-700",
  maintenance: "bg-amber-100 text-amber-700",
  inactive:    "bg-gray-100 text-gray-500",
};

export default function OperatorFleetPage() {
  const active = VEHICLES.filter((v) => v.status === "active").length;
  const maintenance = VEHICLES.filter((v) => v.status === "maintenance").length;

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
            <p className="text-sm text-gray-500">
              {VEHICLES.length} vehicles · {active} active · {maintenance} in maintenance
            </p>
          </div>
          <Button variant="success">+ Add Vehicle</Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Vehicles", value: VEHICLES.length, icon: "🚐", bg: "bg-blue-50",  color: "text-blue-600"  },
            { label: "Active",         value: active,          icon: "✅", bg: "bg-green-50", color: "text-green-600" },
            { label: "Maintenance",    value: maintenance,     icon: "🔧", bg: "bg-amber-50", color: "text-amber-600" },
            { label: "Total Seats",    value: VEHICLES.reduce((s, v) => s + v.seats, 0), icon: "💺", bg: "bg-purple-50", color: "text-purple-600" },
          ].map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} bg={s.bg} color={s.color} />
          ))}
        </div>

        {/* Vehicle cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VEHICLES.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900">{v.id}</p>
                  <p className="text-xs text-gray-400">{v.plate}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[v.status]}`}>
                  {capitalize(v.status)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="font-medium text-gray-700">{v.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Seats</span>
                  <span className="font-medium text-gray-700">{v.seats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Driver</span>
                  <span className="font-medium text-gray-700">{v.driver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mileage</span>
                  <span className="font-medium text-gray-700">{v.mileage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Service</span>
                  <span className="font-medium text-gray-700">{v.lastService}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
