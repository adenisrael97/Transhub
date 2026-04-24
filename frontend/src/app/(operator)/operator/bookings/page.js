"use client";
import { useState } from "react";
import FilterTabs from "@/components/ui/FilterTabs";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize } from "@/lib/utils";

const BOOKINGS = [
  { id: "BK-401", passenger: "Ada Eze",        phone: "08031234567", route: "Lagos → Abuja",  seats: 1, amount: 12000, status: "confirmed", date: "2026-03-25", time: "6:00 AM"  },
  { id: "BK-402", passenger: "Musa Abdullahi", phone: "08029876543", route: "Enugu → Lagos",  seats: 2, amount: 19000, status: "confirmed", date: "2026-03-25", time: "7:30 AM"  },
  { id: "BK-403", passenger: "Ngozi Okafor",   phone: "07045678901", route: "Lagos → Owerri", seats: 1, amount: 8000,  status: "pending",   date: "2026-03-25", time: "9:00 AM"  },
  { id: "BK-404", passenger: "Emeka Chukwu",   phone: "08061122334", route: "Enugu → Abuja",  seats: 3, amount: 33000, status: "confirmed", date: "2026-03-25", time: "1:00 PM"  },
  { id: "BK-405", passenger: "Fatima Bello",   phone: "09011223344", route: "Lagos → Abuja",  seats: 1, amount: 12000, status: "confirmed", date: "2026-03-25", time: "6:00 AM"  },
  { id: "BK-398", passenger: "Chinedu Ikenna", phone: "08055667788", route: "Lagos → Enugu",  seats: 2, amount: 19000, status: "completed", date: "2026-03-24", time: "6:00 AM"  },
  { id: "BK-397", passenger: "Aisha Mohammed", phone: "07099887766", route: "Abuja → Lagos",  seats: 1, amount: 12000, status: "completed", date: "2026-03-24", time: "7:00 AM"  },
  { id: "BK-395", passenger: "Tunde Bakare",   phone: "08033445566", route: "Lagos → Abuja",  seats: 1, amount: 12000, status: "cancelled", date: "2026-03-24", time: "6:00 AM"  },
];

export default function OperatorBookingsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = BOOKINGS.filter((b) => {
    const matchStatus = filter === "all" || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = b.passenger.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.route.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalRevenue = BOOKINGS.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-500">
              {BOOKINGS.length} bookings · ₦{totalRevenue.toLocaleString()} revenue
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search passenger, ID, route…"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
          />
          <FilterTabs items={["all", "confirmed", "pending", "completed", "cancelled"]} active={filter} onChange={setFilter} color="green" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-50">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Passenger</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Seats</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{b.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{b.passenger}</p>
                      <p className="text-xs text-gray-400">{b.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{b.route}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{b.date} · {b.time}</td>
                    <td className="px-6 py-4 text-gray-600">{b.seats}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">₦{b.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[b.status]}`}>
                        {capitalize(b.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🎫</p>
              <p className="font-medium">No bookings match your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
