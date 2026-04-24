"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import FilterTabs from "@/components/ui/FilterTabs";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize } from "@/lib/utils";

const MOCK_BOOKINGS = [
  { id: "BK-001", passenger: "Emeka Okafor",   route: "Lagos → Abuja",         seat: "A1", date: "26 Mar", amount: 9500,  status: "confirmed", payment: "card"     },
  { id: "BK-002", passenger: "Fatima Aliyu",   route: "Kano → Lagos",          seat: "B2", date: "26 Mar", amount: 15000, status: "confirmed", payment: "transfer" },
  { id: "BK-003", passenger: "Tunde Balogun",  route: "Abuja → PH",            seat: "C3", date: "26 Mar", amount: 12000, status: "pending",   payment: "ussd"     },
  { id: "BK-004", passenger: "Chioma Eze",     route: "Lagos → Enugu",         seat: "A4", date: "25 Mar", amount: 11000, status: "completed", payment: "card"     },
  { id: "BK-005", passenger: "Ibrahim Musa",   route: "Kaduna → Abuja",        seat: "D1", date: "25 Mar", amount: 7500,  status: "cancelled", payment: "card"     },
];

export default function AdminBookingsPage() {
  const [bookings] = useState(MOCK_BOOKINGS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchSearch = b.passenger.toLowerCase().includes(search.toLowerCase()) || b.route.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const total = filtered.reduce((sum, b) => sum + (b.status !== "cancelled" ? b.amount : 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-500">{bookings.length} total · ₦{total.toLocaleString()} revenue shown</p>
          </div>
          <Button variant="secondary" size="sm">⬇ Export CSV</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search passenger or route…"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <FilterTabs items={["all", "confirmed", "pending", "completed", "cancelled"]} active={filter} onChange={setFilter} />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-left text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Passenger</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Seat</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{b.id}</td>
                    <td className="px-6 py-4 font-semibold">{b.passenger}</td>
                    <td className="px-6 py-4 text-gray-600">{b.route}</td>
                    <td className="px-6 py-4 font-medium">{b.seat}</td>
                    <td className="px-6 py-4 text-gray-500">{b.date}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">₦{b.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500 capitalize">{b.payment}</td>
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
            <p className="text-center py-12 text-gray-400 text-sm">No bookings match your filter</p>
          )}
        </div>
      </div>
    </div>
  );
}
