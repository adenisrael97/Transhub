"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Ticket, Phone, Heart, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import FilterTabs from "@/components/ui/FilterTabs";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize, formatTime } from "@/lib/utils";
import { useServerList } from "@/hooks/useServerList";
import { fetchBookings } from "@/services/bookings";
import { connectSocket } from "@/lib/socket";

export default function OperatorBookingsPage() {
  const [expandedRow, setExpanded] = useState(null);

  const selectBookings = useCallback((res) => res.bookings ?? [], []);
  const {
    items: bookings, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput, refetch,
  } = useServerList({ fetcher: fetchBookings, select: selectBookings, limit: 20 });

  const activeStatus = filters.status ?? "all";
  const total = pagination?.total ?? 0;

  // Live updates: backend emits "booking:created" for this operator's trips.
  useEffect(() => {
    const socket = connectSocket();
    const onCreated = () => refetch();
    socket.on("booking:created", onCreated);
    return () => { socket.off("booking:created", onCreated); };
  }, [refetch]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Bookings</h1>
            <p className="text-sm text-[#64748B]">
              {loading ? "Loading…" : `${total.toLocaleString()} booking${total === 1 ? "" : "s"}`}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={refetch} loading={loading && bookings.length > 0}>
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
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search passenger, ID, route, ref…"
            className="w-full sm:w-64"
          />
          <FilterTabs
            items={["all", "confirmed", "pending", "cancelled", "refunded"]}
            active={activeStatus}
            onChange={(tab) => setFilter({ status: tab === "all" ? undefined : tab })}
            color="green"
          />
        </div>

        {/* Table */}
        {loading && bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-16 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#16A34A] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">Loading bookings…</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#64748B] font-semibold uppercase tracking-wider border-b border-[#F1F5F9]">
                    {["Booking ID", "Passengers", "Route", "Departure", "Seats", "Amount", "Status", ""].map((h) => (
                      <th key={h} className="px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {bookings.map((b) => {
                    const isExpanded = expandedRow === b.id;
                    const firstPax   = b.passengers?.[0];
                    const extraCount = (b.passengers?.length ?? 0) - 1;

                    return (
                      <React.Fragment key={b.id}>
                        <tr className={`hover:bg-[#F8FAFC] transition-colors ${isExpanded ? "bg-[#F8FAFC]" : ""}`}>
                          <td className="px-5 py-4 font-mono text-xs text-[#64748B]">{b.id.slice(0, 8)}…</td>
                          <td className="px-5 py-4">
                            {firstPax ? (
                              <>
                                <p className="font-semibold text-[#0F172A]">{firstPax.fullName}</p>
                                <a href={`tel:${firstPax.phone}`} className="text-xs text-[#2563EB] hover:underline flex items-center gap-0.5">
                                  <Phone size={10} /> {firstPax.phone}
                                </a>
                                {extraCount > 0 && (
                                  <p className="text-xs text-[#64748B]">+{extraCount} more passenger{extraCount !== 1 ? "s" : ""}</p>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-[#64748B]">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-[#64748B]">{b.trip ? `${b.trip.from} → ${b.trip.to}` : "—"}</td>
                          <td className="px-5 py-4 text-xs text-[#64748B]">{b.trip ? formatTime(b.trip.departureTime) : "—"}</td>
                          <td className="px-5 py-4 text-[#64748B]">{b.seats?.length ?? 0}</td>
                          <td className="px-5 py-4 font-semibold text-[#16A34A]">₦{(b.totalAmount ?? 0).toLocaleString()}</td>
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

                        {isExpanded && b.passengers?.length > 0 && (
                          <tr key={`${b.id}-expanded`} className="bg-[#F8FAFC]">
                            <td colSpan={8} className="px-5 pb-5 pt-0">
                              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                                <div className="px-4 py-2.5 bg-[#F1F5F9] border-b border-[#E2E8F0]">
                                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Passenger Details</p>
                                </div>
                                <div className="divide-y divide-[#F8FAFC]">
                                  {b.passengers.map((pax, idx) => (
                                    <div key={pax.id ?? idx} className="px-4 py-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                      <div>
                                        <p className="text-xs font-semibold text-[#64748B] mb-0.5">Passenger {idx + 1}</p>
                                        <p className="font-semibold text-sm text-[#0F172A]">{pax.fullName}</p>
                                        <a href={`tel:${pax.phone}`} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                                          <Phone size={10} /> {pax.phone}
                                        </a>
                                        {pax.email && <p className="text-xs text-[#64748B] mt-0.5">{pax.email}</p>}
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-[#64748B] mb-0.5 flex items-center gap-1">
                                          <Heart size={10} className="text-[#EF4444]" /> Next of Kin
                                        </p>
                                        <p className="font-semibold text-sm text-[#0F172A]">{pax.nextOfKinName}</p>
                                        <a href={`tel:${pax.nextOfKinPhone}`} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                                          <Phone size={10} /> {pax.nextOfKinPhone}
                                        </a>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <p className="text-xs font-semibold text-[#64748B] mb-0.5">Special Needs</p>
                                        {pax.specialNeeds ? (
                                          <p className="text-sm text-[#475569] bg-[#FEF9C3] border border-[#FDE68A] rounded-lg px-3 py-1.5">{pax.specialNeeds}</p>
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

            {bookings.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Ticket size={24} className="text-[#64748B]" />
                </div>
                <p className="text-sm font-medium text-[#64748B]">No bookings match your search</p>
              </div>
            )}
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
      </div>
    </div>
  );
}
