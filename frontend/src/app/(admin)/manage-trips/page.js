"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize, formatTime } from "@/lib/utils";
import { fetchTrips } from "@/services/trips";

const PAGE_SIZES = [20, 50, 100];

function deriveStatus(trip) {
  if (trip.status === "cancelled") return "cancelled";
  const dep = new Date(trip.departureTime);
  const diffH = (dep - Date.now()) / 36e5;
  if (diffH > 1)   return "scheduled";
  if (diffH > -24) return "active";
  return "completed";
}

/** Compact page number list with ellipsis. E.g. [1] … [4][5][6] … [12] */
function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (current > 4) pages.push("…");
  const lo = Math.max(2, current - 2);
  const hi = Math.min(total - 1, current + 2);
  for (let p = lo; p <= hi; p++) pages.push(p);
  if (current < total - 3) pages.push("…");
  pages.push(total);
  return pages;
}

export default function AdminTripsPage() {
  const [trips,      setTrips]      = useState([]);
  const [meta,       setMeta]       = useState(null);  // { page, limit, total, totalPages }
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [page,       setPage]       = useState(1);
  const [limit,      setLimit]      = useState(20);
  const [search,     setSearch]     = useState("");
  const [inputValue, setInputValue] = useState("");
  const debounceRef = useRef(null);

  const load = useCallback(async (p, l, s) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchTrips({ page: p, limit: l, search: s || undefined });
      setTrips(res.trips ?? []);
      setMeta(res.pagination ?? null);
    } catch {
      setError("Failed to load trips. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever page, limit or search changes
  useEffect(() => { load(page, limit, search); }, [load, page, limit, search]);

  // Debounce the text input: wait 350ms after last keystroke before firing
  function handleSearchChange(e) {
    const val = e.target.value;
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);        // reset to first page on new search
      setSearch(val);
    }, 350);
  }

  function clearSearch() {
    setInputValue("");
    setSearch("");
    setPage(1);
  }

  function goTo(p) {
    if (!meta) return;
    const clamped = Math.max(1, Math.min(p, meta.totalPages));
    setPage(clamped);
  }

  function handleLimitChange(e) {
    setLimit(Number(e.target.value));
    setPage(1);
  }

  const total      = meta?.total      ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  const from       = meta ? (page - 1) * limit + 1 : 0;
  const to         = meta ? Math.min(page * limit, total) : 0;
  const pages      = pageRange(page, totalPages);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">All Trips</h1>
            {meta && !loading && (
              <p className="text-sm text-[#64748B] mt-0.5">
                {total.toLocaleString()} trip{total !== 1 ? "s" : ""} across all operators
              </p>
            )}
          </div>

          {/* Search + per-page controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
              <input
                value={inputValue}
                onChange={handleSearchChange}
                placeholder="Search city…"
                className="pl-9 pr-8 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] w-52 transition-shadow"
              />
              {inputValue && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Rows per page */}
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <span className="hidden sm:inline whitespace-nowrap">Rows:</span>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="border border-[#E2E8F0] rounded-xl px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1F5F9] text-left text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">
                  {["Route", "Operator", "Departure", "Price", "Seats", "Status", "Availability"].map((h) => (
                    <th key={h} className="px-6 py-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {loading ? (
                  // Skeleton rows while loading
                  Array.from({ length: limit > 10 ? 8 : 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className={`h-4 bg-[#F1F5F9] rounded animate-pulse ${j === 0 ? "w-32" : j === 1 ? "w-28" : "w-16"}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : trips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <p className="text-sm font-medium text-[#94A3B8]">
                        {search ? `No trips found matching "${search}"` : "No trips found"}
                      </p>
                      {search && (
                        <button
                          onClick={clearSearch}
                          className="mt-2 text-xs text-[#2563EB] hover:underline"
                        >
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  trips.map((trip) => {
                    const status = deriveStatus(trip);
                    const booked = (trip.totalSeats ?? 0) - (trip.availableSeats ?? 0);
                    return (
                      <tr key={trip.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#0F172A] whitespace-nowrap">{trip.from} → {trip.to}</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">{trip.vehicleType}</p>
                        </td>
                        <td className="px-6 py-4 text-[#64748B] max-w-40 truncate">{trip.operator}</td>
                        <td className="px-6 py-4 text-[#64748B] whitespace-nowrap">{formatTime(trip.departureTime)}</td>
                        <td className="px-6 py-4 font-medium text-[#2563EB] whitespace-nowrap">₦{trip.price.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-[#0F172A]">{booked}</span>
                          <span className="text-[#94A3B8]">/{trip.totalSeats}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_BADGE[status] ?? STATUS_BADGE.scheduled}`}>
                            {capitalize(status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            trip.isActive !== false
                              ? "bg-[#F0FDF4] text-[#16A34A]"
                              : "bg-[#FEF2F2] text-[#DC2626]"
                          }`}>
                            {trip.isActive !== false ? "Online" : "Offline"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination footer ── */}
          {meta && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[#F1F5F9]">
              {/* Range label */}
              <p className="text-sm text-[#64748B] whitespace-nowrap">
                Showing{" "}
                <span className="font-semibold text-[#0F172A]">{from.toLocaleString()}–{to.toLocaleString()}</span>
                {" "}of{" "}
                <span className="font-semibold text-[#0F172A]">{total.toLocaleString()}</span>
                {" "}trip{total !== 1 ? "s" : ""}
                {search && <span className="text-[#2563EB]"> for "{search}"</span>}
              </p>

              {/* Page controls */}
              <div className="flex items-center gap-1">
                {/* First */}
                <button
                  onClick={() => goTo(1)}
                  disabled={page === 1 || loading}
                  title="First page"
                  className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft size={16} />
                </button>
                {/* Prev */}
                <button
                  onClick={() => goTo(page - 1)}
                  disabled={page === 1 || loading}
                  title="Previous page"
                  className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-1">
                  {pages.map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="w-8 text-center text-[#94A3B8] text-sm select-none">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goTo(p)}
                        disabled={loading}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-[#2563EB] text-white shadow-sm"
                            : "text-[#475569] hover:bg-[#F1F5F9]"
                        } disabled:cursor-not-allowed`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                {/* Next */}
                <button
                  onClick={() => goTo(page + 1)}
                  disabled={page === totalPages || loading}
                  title="Next page"
                  className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                {/* Last */}
                <button
                  onClick={() => goTo(totalPages)}
                  disabled={page === totalPages || loading}
                  title="Last page"
                  className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
