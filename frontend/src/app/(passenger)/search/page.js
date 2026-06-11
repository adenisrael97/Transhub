"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Bus, AlertTriangle, SlidersHorizontal, X } from "lucide-react";
import TripCard from "@/components/booking/TripCard";
import Button from "@/components/ui/Button";
import Pagination from "@/components/shared/Pagination";
import { Select } from "@/components/ui/Input";
import { CITIES, VEHICLE_TYPES, AMENITY_FILTERS } from "@/lib/constants";
import { searchTrips as searchTripsApi } from "@/services/trips";
import { fetchPublicOperators } from "@/services/operators";
import { getErrorMessage } from "@/lib/utils";
import useFleetStore from "@/store/fleetStore";

const SORT_OPTIONS = [
  { value: "departure",  label: "Departure: earliest" },
  { value: "price_asc",  label: "Price: low → high" },
  { value: "price_desc", label: "Price: high → low" },
];

const EMPTY_FILTERS = {
  vehicleType: "",
  minPrice:    "",
  maxPrice:    "",
  amenities:   [],
  operatorId:  "",
  sort:        "departure",
};

const PAGE_SIZE = 9;

function countActiveFilters(f) {
  let n = 0;
  if (f.vehicleType) n++;
  if (f.minPrice !== "") n++;
  if (f.maxPrice !== "") n++;
  if (f.operatorId) n++;
  n += f.amenities.length;
  return n;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    from:       searchParams.get("from") ?? "",
    to:         searchParams.get("to")   ?? "",
    date:       searchParams.get("date") ?? "",
    passengers: "1",
  });
  // The committed route — the search is only (re)run for a route the user submitted.
  const [route, setRoute] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [trips, setTrips] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [operators, setOperators] = useState([]);

  const getVisibleTrips = useFleetStore((s) => s.getVisibleTrips);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Operator dropdown — load approved companies once.
  useEffect(() => {
    let active = true;
    fetchPublicOperators()
      .then((res) => { if (active) setOperators(res.operators ?? []); })
      .catch(() => { /* dropdown just stays empty if this fails */ });
    return () => { active = false; };
  }, []);

  const reqId = useRef(0);
  const runSearch = useCallback(async (r, f, p) => {
    if (!r) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const params = {
        from: r.from, to: r.to, date: r.date, passengers: r.passengers,
        sort: f.sort, page: p, limit: PAGE_SIZE,
      };
      if (f.vehicleType)      params.vehicleType = f.vehicleType;
      if (f.minPrice !== "")  params.minPrice = Number(f.minPrice);
      if (f.maxPrice !== "")  params.maxPrice = Number(f.maxPrice);
      if (f.amenities.length) params.amenities = f.amenities;
      if (f.operatorId)       params.operatorId = f.operatorId;

      const data = await searchTripsApi(params);
      if (id !== reqId.current) return; // superseded by a newer search
      setTrips(data.trips ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      if (id !== reqId.current) return;
      setError(getErrorMessage(err, "Could not fetch trips"));
      setTrips([]);
      setPagination(null);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  // Run search whenever the committed route, filters, or page changes.
  useEffect(() => {
    if (route) runSearch(route, filters, page);
  }, [route, filters, page, runSearch]);

  // Auto-search on mount if the URL pre-filled a route.
  useEffect(() => {
    if (form.from && form.to && form.date) {
      setRoute({ from: form.from, to: form.to, date: form.date, passengers: form.passengers });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    setRoute({ from: form.from, to: form.to, date: form.date, passengers: form.passengers });
  }

  function patchFilter(patch) {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  }

  function toggleAmenity(a) {
    setPage(1);
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  }

  function clearFilters() {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  }

  const searched = route !== null;
  const usingFallback = searched && !!error;
  const displayTrips = usingFallback ? getVisibleTrips(form) : trips;
  const activeFilters = countActiveFilters(filters);
  const total = pagination?.total ?? displayTrips.length;

  const fieldClass =
    "border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Search bar */}
      <div className="bg-linear-to-r from-[#1E40AF] to-[#2563EB] py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Find Available Trips</h1>
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-5 gap-2 shadow-xl">
            <Select required value={form.from} onChange={(e) => set("from", e.target.value)}>
              <option value="">From</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select required value={form.to} onChange={(e) => set("to", e.target.value)}>
              <option value="">To</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] col-span-1"
            />
            <Select value={form.passengers} onChange={(e) => set("passengers", e.target.value)}>
              <option value="1">1 passenger</option>
              <option value="2">2 passengers</option>
              <option value="3">3 passengers</option>
              <option value="4">4 passengers</option>
            </Select>
            <Button type="submit" loading={loading} fullWidth rightIcon={<Search size={15} />}>
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {error && (
          <div className="flex items-center gap-2 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-xl p-4 mb-6 text-sm">
            <AlertTriangle size={15} className="shrink-0" />
            Live backend unavailable. Showing available buses from local demo fleet.
          </div>
        )}

        {!searched && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-[#2563EB]" />
            </div>
            <p className="text-lg font-semibold text-[#0F172A]">Search for a trip to get started</p>
            <p className="text-sm text-[#64748B] mt-1">Select your route and date above</p>
          </div>
        )}

        {searched && (
          <>
            {/* Results header + filter toggle */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[#475569]">
                {loading ? "Searching…" : (
                  <>
                    <span className="font-bold text-[#0F172A]">{total}</span> trip{total === 1 ? "" : "s"} found
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowFilters((s) => !s)}
                aria-expanded={showFilters}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] border border-[#E2E8F0] px-3 py-1.5 rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                <SlidersHorizontal size={13} /> Filters
                {activeFilters > 0 && (
                  <span className="bg-[#2563EB] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Sort by</span>
                    <select aria-label="Sort by" value={filters.sort} onChange={(e) => patchFilter({ sort: e.target.value })} className={fieldClass}>
                      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Vehicle type</span>
                    <select aria-label="Vehicle type" value={filters.vehicleType} onChange={(e) => patchFilter({ vehicleType: e.target.value })} className={fieldClass}>
                      <option value="">All vehicles</option>
                      {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Transport company</span>
                    <select aria-label="Transport company" value={filters.operatorId} onChange={(e) => patchFilter({ operatorId: e.target.value })} className={fieldClass}>
                      <option value="">All companies</option>
                      {operators.map((o) => <option key={o.id} value={o.id}>{o.companyName}</option>)}
                    </select>
                  </label>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Price (₦)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" inputMode="numeric" placeholder="Min" aria-label="Minimum price"
                        value={filters.minPrice}
                        onChange={(e) => patchFilter({ minPrice: e.target.value })}
                        className={`${fieldClass} w-full`}
                      />
                      <span className="text-[#64748B]">–</span>
                      <input
                        type="number" min="0" inputMode="numeric" placeholder="Max" aria-label="Maximum price"
                        value={filters.maxPrice}
                        onChange={(e) => patchFilter({ maxPrice: e.target.value })}
                        className={`${fieldClass} w-full`}
                      />
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Amenities</span>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_FILTERS.map((a) => {
                      const checked = filters.amenities.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          aria-pressed={checked}
                          onClick={() => toggleAmenity(a)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                            checked
                              ? "bg-[#2563EB] text-white border-[#2563EB]"
                              : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeFilters > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs font-semibold text-[#DC2626] hover:underline"
                  >
                    <X size={12} /> Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Empty state */}
            {!loading && displayTrips.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bus size={28} className="text-[#64748B]" />
                </div>
                <p className="text-lg font-semibold text-[#0F172A]">
                  {activeFilters > 0 ? "No trips match your filters" : "No trips found for this route"}
                </p>
                <p className="text-sm text-[#64748B] mt-1">
                  {activeFilters > 0 ? "Try widening your price range or clearing filters" : "Try a different date or route"}
                </p>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="mt-4 text-sm font-semibold text-[#2563EB] hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            {displayTrips.length > 0 && (
              <>
                <div className="grid gap-4">
                  {displayTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
                </div>
                {!usingFallback && (
                  <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#64748B]">Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}
