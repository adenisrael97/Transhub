"use client";
import { useCallback, useState } from "react";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize, formatTime } from "@/lib/utils";
import { useServerList } from "@/hooks/useServerList";
import { fetchBookings } from "@/services/bookings";

const STATUS_TABS = ["all", "confirmed", "pending", "cancelled", "refunded"];

export default function AdminBookingsPage() {
  const [showFilters, setShowFilters] = useState(false);

  const selectBookings = useCallback((res) => res.bookings ?? [], []);
  const {
    items: bookings, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput,
  } = useServerList({ fetcher: fetchBookings, select: selectBookings, limit: 20 });

  const activeStatus = filters.status ?? "all";
  const total = pagination?.total ?? 0;

  const fieldClass =
    "border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Bookings</h1>
            <p className="text-sm text-[#64748B]">
              {loading ? "Loading…" : `${total.toLocaleString()} booking${total === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search ID, ref, name, email, phone, route…"
            className="w-72 max-w-full"
          />
          <FilterTabs
            items={STATUS_TABS}
            active={activeStatus}
            onChange={(tab) => setFilter({ status: tab === "all" ? undefined : tab })}
          />
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] border border-[#E2E8F0] px-3 py-2 rounded-xl hover:bg-white transition-colors"
          >
            <SlidersHorizontal size={13} /> More
          </button>
        </div>

        {showFilters && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">From date</span>
              <input type="date" value={filters.dateFrom ?? ""} onChange={(e) => setFilter({ dateFrom: e.target.value || undefined })} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">To date</span>
              <input type="date" value={filters.dateTo ?? ""} onChange={(e) => setFilter({ dateTo: e.target.value || undefined })} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Min ₦</span>
              <input type="number" min="0" value={filters.minAmount ?? ""} onChange={(e) => setFilter({ minAmount: e.target.value || undefined })} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Max ₦</span>
              <input type="number" min="0" value={filters.maxAmount ?? ""} onChange={(e) => setFilter({ maxAmount: e.target.value || undefined })} className={fieldClass} />
            </label>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[#64748B]">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-sm">Loading bookings…</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center text-[#64748B] text-sm flex flex-col items-center gap-2">
              <X size={22} />
              No bookings match your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-left text-xs text-[#64748B] font-semibold uppercase tracking-wider">
                    {["Booking ID", "Route", "Payment Ref", "Seats", "Amount", "Date", "Status"].map((h) => (
                      <th key={h} className="px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-[#64748B]">{b.id.slice(0, 8)}…</td>
                      <td className="px-6 py-4 text-[#475569] text-xs">{b.trip ? `${b.trip.from} → ${b.trip.to}` : "—"}</td>
                      <td className="px-6 py-4 font-mono text-xs text-[#64748B]">{b.paymentRef ?? "—"}</td>
                      <td className="px-6 py-4 font-medium text-[#475569]">{b.seats.map((s) => s.label).join(", ") || "—"}</td>
                      <td className="px-6 py-4 font-semibold text-[#2563EB]">₦{b.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-[#64748B] text-xs">{formatTime(b.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[b.status] ?? STATUS_BADGE.pending}`}>
                          {capitalize(b.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
      </div>
    </div>
  );
}
