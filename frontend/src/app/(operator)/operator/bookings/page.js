"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Ticket, Search, Phone, Heart, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import FilterTabs from "@/components/ui/FilterTabs";
import Button from "@/components/ui/Button";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize, formatTime } from "@/lib/utils";
import { fetchBookings } from "@/services/bookings";

export default function OperatorBookingsPage() {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [expandedRow, setExpanded] = useState(null);
  const [tripFilter, setTripFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchBookings();
      setBookings(res.bookings ?? []);
    } catch {
      setError("Failed to load bookings. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derive unique trips for the filter dropdown
  const uniqueTrips = Array.from(
    new Map(
      bookings
        .filter((b) => b.trip)
        .map((b) => [`${b.trip.from}→${b.trip.to}`, b.trip])
    ).entries()
  ).map(([key, trip]) => ({ key, label: `${trip.from} → ${trip.to}` }));

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "all" || b.status === filter;
    const route = b.trip ? `${b.trip.from} ${b.trip.to}` : "";
    const paxNames = (b.passengers ?? []).map((p) => p.fullName.toLowerCase()).join(" ");
    const q = search.toLowerCase();
    const matchSearch =
      b.id.toLowerCase().includes(q) ||
      route.toLowerCase().includes(q) ||
      paxNames.includes(q);
    const routeKey = b.trip ? `${b.trip.from}→${b.trip.to}` : "";
    const matchTrip = tripFilter === "all" || routeKey === tripFilter;
    return matchStatus && matchSearch && matchTrip;
  });

  const totalRevenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Bookings</h1>
            <p className="text-sm text-[#64748B]">
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""} · ₦{totalRevenue.toLocaleString()} revenue
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={load} loading={loading && bookings.length > 0}>
            <RefreshCw size={14} className="mr-1.5" /> Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search passenger, ID, route…"
              className="pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] w-full sm:w-64"
            />
          </div>
          {uniqueTrips.length > 1 && (
            <select
              value={tripFilter}
              onChange={(e) => setTripFilter(e.target.value)}
              className="px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            >
              <option value="all">All Routes</option>
              {uniqueTrips.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          )}
          <FilterTabs
            items={["all", "confirmed", "pending", "completed", "cancelled"]}
            active={filter}
            onChange={setFilter}
            color="green"
          />
        </div>

        {/* Table */}
        {loading && bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-16 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#16A34A] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">Loading bookings…</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#94A3B8] font-semibold uppercase tracking-wider border-b border-[#F1F5F9]">
                    {["Booking ID", "Passengers", "Route", "Departure", "Seats", "Amount", "Status", ""].map((h) => (
                      <th key={h} className="px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filtered.map((b) => {
                    const isExpanded = expandedRow === b.id;
                    const firstPax   = b.passengers?.[0];
                    const extraCount = (b.passengers?.length ?? 0) - 1;

                    return (
                      <React.Fragment key={b.id}>
                        <tr
                          className={`hover:bg-[#F8FAFC] transition-colors ${isExpanded ? "bg-[#F8FAFC]" : ""}`}
                          className={`hover:bg-[#F8FAFC] transition-colors ${isExpanded ? "bg-[#F8FAFC]" : ""}`}
                        >
                          <td className="px-5 py-4 font-mono text-xs text-[#94A3B8]">
                            {b.id.slice(0, 8)}…
                          </td>
                          <td className="px-5 py-4">
                            {firstPax ? (
                              <>
                                <p className="font-semibold text-[#0F172A]">{firstPax.fullName}</p>
                                <a
                                  href={`tel:${firstPax.phone}`}
                                  className="text-xs text-[#2563EB] hover:underline flex items-center gap-0.5"
                                >
                                  <Phone size={10} /> {firstPax.phone}
                                </a>
                                {extraCount > 0 && (
                                  <p className="text-xs text-[#94A3B8]">+{extraCount} more passenger{extraCount !== 1 ? "s" : ""}</p>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-[#94A3B8]">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-[#64748B]">
                            {b.trip ? `${b.trip.from} → ${b.trip.to}` : "—"}
                          </td>
                          <td className="px-5 py-4 text-xs text-[#64748B]">
                            {b.trip ? formatTime(b.trip.departureTime) : "—"}
                          </td>
                          <td className="px-5 py-4 text-[#64748B]">{b.seats?.length ?? 0}</td>
                          <td className="px-5 py-4 font-semibold text-[#16A34A]">
                            ₦{(b.totalAmount ?? 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[b.status] ?? ""}`}>
                              {capitalize(b.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {(b.passengers?.length > 0) && (
                              <button
                                onClick={() => setExpanded(isExpanded ? null : b.id)}
                                className="text-[#64748B] hover:text-[#2563EB] transition-colors"
                                title={isExpanded ? "Collapse" : "Passenger details"}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expanded passenger details */}
                        {isExpanded && b.passengers?.length > 0 && (
                          <tr key={`${b.id}-expanded`} className="bg-[#F8FAFC]">
                            <td colSpan={8} className="px-5 pb-5 pt-0">
                              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                                <div className="px-4 py-2.5 bg-[#F1F5F9] border-b border-[#E2E8F0]">
                                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                                    Passenger Details
                                  </p>
                                </div>
                                <div className="divide-y divide-[#F8FAFC]">
                                  {b.passengers.map((pax, idx) => (
                                    <div key={pax.id ?? idx} className="px-4 py-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                      {/* Passenger info */}
                                      <div>
                                        <p className="text-xs font-semibold text-[#94A3B8] mb-0.5">Passenger {idx + 1}</p>
                                        <p className="font-semibold text-sm text-[#0F172A]">{pax.fullName}</p>
                                        <a href={`tel:${pax.phone}`} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                                          <Phone size={10} /> {pax.phone}
                                        </a>
                                        {pax.email && (
                                          <p className="text-xs text-[#94A3B8] mt-0.5">{pax.email}</p>
                                        )}
                                      </div>

                                      {/* Next of kin */}
                                      <div>
                                        <p className="text-xs font-semibold text-[#94A3B8] mb-0.5 flex items-center gap-1">
                                          <Heart size={10} className="text-[#EF4444]" /> Next of Kin
                                        </p>
                                        <p className="font-semibold text-sm text-[#0F172A]">{pax.nextOfKinName}</p>
                                        <a href={`tel:${pax.nextOfKinPhone}`} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                                          <Phone size={10} /> {pax.nextOfKinPhone}
                                        </a>
                                      </div>

                                      {/* Special needs */}
                                      <div className="sm:col-span-2">
                                        <p className="text-xs font-semibold text-[#94A3B8] mb-0.5">Special Needs</p>
                                        {pax.specialNeeds ? (
                                          <p className="text-sm text-[#475569] bg-[#FEF9C3] border border-[#FDE68A] rounded-lg px-3 py-1.5">
                                            {pax.specialNeeds}
                                          </p>
                                        ) : (
                                          <p className="text-xs text-[#CBD5E1] italic">None specified</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Ticket size={24} className="text-[#94A3B8]" />
                </div>
                <p className="text-sm font-medium text-[#94A3B8]">
                  {bookings.length === 0 ? "No bookings yet" : "No bookings match your search"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
